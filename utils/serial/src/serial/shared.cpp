#include "serial.hpp"

#include <chrono>
#include <iostream>
#include <iomanip>
#include <fstream>

#include "crashAnalyzer.hpp"
#include "libInterface.hpp"

std::string DPSerial::s_path;
FILEHANDLE DPSerial::s_handle;
std::thread DPSerial::s_worker;
bool DPSerial::s_workerRunning = false;

std::queue<Packet> DPSerial::s_highPrioSendQueue;
std::queue<Packet> DPSerial::s_lowPrioSendQueue;
std::queue<Packet> DPSerial::s_receiveQueue;

bool DPSerial::s_pantoReady = true;
uint32_t DPSerial::s_magicReceiveIndex = 0;
ReceiveState DPSerial::s_receiveState = NONE;
Header DPSerial::s_receiveHeader = {0, 0};

void DPSerial::startWorker()
{
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
}

void DPSerial::update()
{
    while (s_workerRunning)
    {
        processOutput();
        while (processInput())
            ;

        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
}

void DPSerial::processOutput()
{
    Packet packet;
    // always send high prio packets (sync/heartbeat)
    if (!s_highPrioSendQueue.empty())
    {
        packet = s_highPrioSendQueue.front();
        s_highPrioSendQueue.pop();
    }
    // otherwise, check if panto buffer is critical
    else if (!s_pantoReady)
    {
        return;
    }
    // otherwise, send a low prio packet
    else if (!s_lowPrioSendQueue.empty())
    {
        packet = s_lowPrioSendQueue.front();
        s_lowPrioSendQueue.pop();
    }
    // no packets, nothing to do
    else
    {
        return;
    }

    uint8_t header[c_headerSize];
    header[0] = packet.header.MessageType;
    header[1] = packet.header.PayloadSize >> 8;
    header[2] = packet.header.PayloadSize & 255;

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
    s_receiveHeader.PayloadSize = received[1] << 8 | received[2];

    switch (s_receiveHeader.MessageType)
    {
    case BUFFER_CRITICAL:
        s_pantoReady = false;
        s_receiveState = NONE;
        logString("BUFFER_CRITICAL");
    case BUFFER_READY:
        s_pantoReady = true;
        s_receiveState = NONE;
        logString("BUFFER_READY");
    default:
        s_receiveState = FOUND_HEADER;
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

    auto p = Packet(s_receiveHeader.MessageType, size);
    memcpy(p.payload, received.data(), size);
    s_receiveQueue.push(p);
    s_receiveState = NONE;
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