#include "serial.hpp"

#include <chrono>
#include <iostream>
#include <iomanip>
#include <fstream>
#include <sstream>

#include "crashAnalyzer.hpp"
#include "libInterface.hpp"

std::string DPSerial::s_path;
FILEHANDLE DPSerial::s_handle;
std::thread DPSerial::s_worker;
bool DPSerial::s_workerRunning = false;

std::queue<Packet> DPSerial::s_highPrioSendQueue;
std::queue<Packet> DPSerial::s_lowPrioSendQueue;
std::queue<Packet> DPSerial::s_receiveQueue;
uint8_t DPSerial::s_nextTrackedPacketId = 1;
bool DPSerial::s_haveUnacknowledgedTrackedPacket = false;
Packet DPSerial::s_lastTrackedPacket(0, 0);
std::chrono::time_point<std::chrono::steady_clock>
    DPSerial::s_lastTrackedPacketSendTime;
bool DPSerial::s_pantoReportedInvalidData = false;
const std::chrono::milliseconds DPSerial::c_trackedPacketTimeout(10);

bool DPSerial::s_pantoReady = true;
uint32_t DPSerial::s_magicReceiveIndex = 0;
ReceiveState DPSerial::s_receiveState = NONE;
Header DPSerial::s_receiveHeader = {0, 0};

void DPSerial::startWorker()
{
    reset();
    s_workerRunning = true;
    s_worker = std::thread(update);
}

void DPSerial::stopWorker()
{
    s_workerRunning = false;
    s_worker.join();
}

void DPSerial::sendInstantPacket(Packet p)
{
    s_highPrioSendQueue.push(p);
}

void DPSerial::sendPacket(Packet p)
{
    s_lowPrioSendQueue.push(p);
}

void DPSerial::reset()
{
    std::queue<Packet> emptyHP;
    std::swap(s_highPrioSendQueue, emptyHP);
    std::queue<Packet> emptyLP;
    std::swap(s_lowPrioSendQueue, emptyLP);
    std::queue<Packet> emptyRec;
    std::swap(s_receiveQueue, emptyRec);
    s_nextTrackedPacketId = 1;
    s_haveUnacknowledgedTrackedPacket = false;
    s_lastTrackedPacketSendTime;
    s_pantoReportedInvalidData = false;
    s_pantoReady = true;
    s_magicReceiveIndex = 0;
    s_receiveState = NONE;
    s_receiveHeader = {0, 0};
}

void DPSerial::update()
{
    while (s_workerRunning)
    {
        while (processInput())
            ;
        processOutput();
    }
}

bool DPSerial::isTracked(uint8_t t)
{
    auto it = TrackedMessageTypes.find((MessageType)t);
    return it != TrackedMessageTypes.end();
}

bool DPSerial::checkQueue(std::queue<Packet> &q)
{
    if (q.empty())
    {
        return false;
    }
    auto tracked = isTracked(q.front().header.MessageType);
    return !tracked || !s_haveUnacknowledgedTrackedPacket;
}

void DPSerial::processOutput()
{
    bool resend = false;
    Packet packet(255, 0);

    // send high prio packets (sync/heartbeat)
    if (checkQueue(s_highPrioSendQueue))
    {
        packet = s_highPrioSendQueue.front();
        s_highPrioSendQueue.pop();
    }
    // otherwise, check if panto buffer is critical
    else if (!s_pantoReady)
    {
        return;
    }
    // check if the last tracked message has to be resent
    else if (
        s_haveUnacknowledgedTrackedPacket &&
        std::chrono::steady_clock::now() - s_lastTrackedPacketSendTime >
            c_trackedPacketTimeout)
    {
        logString("Packet timed out, resending");
        packet = s_lastTrackedPacket;
    }
    // otherwise, send a low prio packet
    else if (checkQueue(s_lowPrioSendQueue))
    {
        packet = s_lowPrioSendQueue.front();
        s_lowPrioSendQueue.pop();
    }
    // no packets, nothing to do
    else
    {
        return;
    }

    if (packet.payloadIndex != packet.header.PayloadSize)
    {
        logString("INVALID PACKET");
        return;
    }

    if (isTracked(packet.header.MessageType))
    {
        if (packet.header.PacketId == 0)
        {
            packet.header.PacketId = s_nextTrackedPacketId++;
            if (s_nextTrackedPacketId == 0)
            {
                s_nextTrackedPacketId++;
            }
        }
        s_haveUnacknowledgedTrackedPacket = true;
        s_lastTrackedPacket = packet;
        s_lastTrackedPacketSendTime = std::chrono::steady_clock::now();
    }

    uint8_t header[c_headerSize];
    header[0] = packet.header.MessageType;
    header[1] = packet.header.PacketId;
    header[2] = packet.header.PayloadSize >> 8;
    header[3] = packet.header.PayloadSize & 255;

    write(c_magicNumber, c_magicNumberSize);
    write(header, c_headerSize);
    write(packet.payload, packet.header.PayloadSize);
}

bool DPSerial::processInput()
{
    switch (s_receiveState)
    {
    case NONE:
        return readMagicNumber();
    case FOUND_MAGIC:
        return readHeader();
    case FOUND_HEADER:
        return readPayload();
    default:
        return false;
    }
}

bool DPSerial::readMagicNumber()
{
    uint8_t received;
    while (s_magicReceiveIndex < c_magicNumberSize &&
           readBytesIfAvailable(&received, 1))
    {
        if (received == c_magicNumber[s_magicReceiveIndex])
        {
            ++s_magicReceiveIndex;
        }
        else
        {
            std::cout << received;
            s_magicReceiveIndex = 0;
#ifndef SKIP_ANALYZER
            CrashAnalyzer::push_back(received);
#endif
        }
    }
    if (s_magicReceiveIndex != c_magicNumberSize)
    {
        return false;
    };
    s_receiveState = FOUND_MAGIC;
    s_magicReceiveIndex = 0;
    return true;
}

bool DPSerial::readHeader()
{
    uint8_t received[c_headerSize];
    if (!readBytesFromSerial(received, c_headerSize))
    {
        return false;
    }

    s_receiveHeader.MessageType = received[0];
    s_receiveHeader.PacketId = received[1];
    s_receiveHeader.PayloadSize = received[2] << 8 | received[3];

    // handle no-payload low level messages instantly
    switch (s_receiveHeader.MessageType)
    {
    case BUFFER_CRITICAL:
        s_pantoReady = false;
        s_receiveState = NONE;
        logString("Panto buffer critical");
        break;
    case BUFFER_READY:
        s_pantoReady = true;
        s_receiveState = NONE;
        logString("Panto buffer ready");
        break;
    case INVALID_DATA:
        s_receiveState = NONE;
        s_pantoReportedInvalidData = true;
        logString("Panto received invalid data");
        break;
    default:
        s_receiveState = FOUND_HEADER;
        break;
    }
    return true;
}

bool DPSerial::readPayload()
{
    const uint16_t size = s_receiveHeader.PayloadSize;
    std::vector<char> received;
    received.reserve(size);
    if (!readBytesFromSerial(received.data(), size))
    {
        return false;
    }

    auto packet = Packet(s_receiveHeader.MessageType, size);
    memcpy(packet.payload, received.data(), size);
    s_receiveState = NONE;

    // handle payload low level messages instantly
    switch (s_receiveHeader.MessageType)
    {
    case PACKET_ACK:
    {
        auto id = packet.receiveUInt8();
        if (!s_haveUnacknowledgedTrackedPacket)
        {
            logString("Received unexpected PACKET_ACK");
        }
        else if (id != s_lastTrackedPacket.header.PacketId)
        {
            std::ostringstream oss;
            oss << "Received PACKET_ACK for wrong packet. Expected "
                << (int)s_lastTrackedPacket.header.PacketId << ", received "
                << (int)id << std::endl;
            logString((char *)oss.str().c_str());
        }
        else
        {
            s_haveUnacknowledgedTrackedPacket = false;
        }
        break;
    }
    case INVALID_PACKET_ID:
    {
        std::ostringstream oss;
        oss << "Panto reports INVALID_PACKET_ID. Expected "
            << (int)packet.receiveUInt8() << ", received "
            << (int)packet.receiveUInt8() << std::endl;
        logString((char *)oss.str().c_str());
        break;
    }
    default:
        s_receiveQueue.push(packet);
        break;
    }

    return true;
}

bool DPSerial::readBytesIfAvailable(void *target, uint32_t length)
{
    if (getAvailableByteCount(s_handle) < length)
    {
        return false;
    }
    return readBytesFromSerial(target, length);
}