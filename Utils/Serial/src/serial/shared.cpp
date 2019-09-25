#include "serial.hpp"

#include <iostream>
#include <iomanip>
#include <fstream>

std::string DPSerial::s_path;
uint8_t DPSerial::s_headerBuffer[DPSerial::c_headerSize];
Header DPSerial::s_header = Header();
uint8_t DPSerial::s_packetBuffer[c_packetSize];
FILEHANDLE DPSerial::s_handle;

void DPSerial::receivePacket()
{
    uint8_t received;
    uint32_t index = 0;

    while (index < c_magicNumberSize)
    {
        readBytesFromSerial(&received, 1);
        if (received == c_magicNumber[index])
        {
            ++index;
        }
        else
        {
            std::cout << received;
            index = 0;
        }
    }

    readBytesFromSerial(s_headerBuffer, c_headerSize);

    s_header.MessageType = s_headerBuffer[0];
    s_header.PayloadSize = s_headerBuffer[1] << 8 | s_headerBuffer[2];

    if(s_header.PayloadSize > c_maxPayloadSize)
    {
        return;
    }

    readBytesFromSerial(s_packetBuffer, s_header.PayloadSize);
}

void DPSerial::sendPacket()
{
    s_headerBuffer[0] = s_header.MessageType;
    s_headerBuffer[1] = s_header.PayloadSize >> 8;
    s_headerBuffer[2] = s_header.PayloadSize & 255;

    write(c_magicNumber, c_magicNumberSize);
    write(s_headerBuffer, c_headerSize);
    write(s_packetBuffer, s_header.PayloadSize);
}

uint8_t DPSerial::receiveUInt8(uint16_t& offset)
{
    return s_packetBuffer[offset++];
}

int16_t DPSerial::receiveInt16(uint16_t& offset)
{
    uint8_t temp[2];
    for (auto i = 0; i < 2; ++i)
    {
        temp[i] = s_packetBuffer[offset + i];
    }
    offset += 2;
    return temp[0] << 8 | temp[1];
}

uint16_t DPSerial::receiveUInt16(uint16_t& offset)
{
    auto temp = receiveInt16(offset);
    return *reinterpret_cast<uint16_t*>(&temp);
}

int32_t DPSerial::receiveInt32(uint16_t& offset)
{
    uint8_t temp[4];
    for (auto i = 0; i < 4; ++i)
    {
        temp[i] = s_packetBuffer[offset + i];
    }
    offset += 4;
    return temp[0] << 24 | temp[1] << 16 | temp[2] << 8 | temp[3];
}

uint32_t DPSerial::receiveUInt32(uint16_t& offset)
{
    auto temp = receiveInt32(offset);
    return *reinterpret_cast<uint32_t*>(&temp);
}

float DPSerial::receiveFloat(uint16_t& offset)
{
    auto temp = receiveInt32(offset);
    return *reinterpret_cast<float*>(&temp);
}

void DPSerial::sendUInt8(uint8_t value, uint16_t& offset)
{
    s_packetBuffer[offset++] = value;
}

void DPSerial::sendInt16(int16_t value, uint16_t& offset)
{
    s_packetBuffer[offset++] = value >> 8;
    s_packetBuffer[offset++] = value & 255;
}

void DPSerial::sendUInt16(uint16_t value, uint16_t& offset)
{
    sendInt16(*reinterpret_cast<int16_t*>(&value), offset);
}

void DPSerial::sendInt32(int32_t value, uint16_t& offset)
{
    s_packetBuffer[offset++] = value >> 24;
    s_packetBuffer[offset++] = (value >> 16) & 255;
    s_packetBuffer[offset++] = (value >> 8) & 255;
    s_packetBuffer[offset++] = value & 255;
}

void DPSerial::sendUInt32(uint32_t value, uint16_t& offset)
{
    sendInt32(*reinterpret_cast<int32_t*>(&value), offset);
}

void DPSerial::sendFloat(float value, uint16_t& offset)
{
    sendInt32(*reinterpret_cast<int32_t*>(&value), offset);
}

void dumpBuffer(uint8_t* begin, uint32_t size)
{
    const uint32_t bytesPerLine = 16;
    uint32_t index = 0;

    std::cout << std::hex << std::uppercase << std::setfill('0');

    while (index < size)
    {
        std::cout << "0x" << std::setw(8) << index << " |";
        for (auto i = 0u; i < bytesPerLine && index + i < size; ++i)
        {
            std::cout << " " << std::setw(2) << (int)begin[index + i];
        }
        std::cout << std::endl;
        index += bytesPerLine;
    }
}

void DPSerial::dumpBuffers()
{
    std::cout << "===== HEADER =====" << std::endl;
    dumpBuffer(s_headerBuffer, c_headerSize);
    std::cout << "===== PACKET =====" << std::endl;
    dumpBuffer(s_packetBuffer, s_header.PayloadSize);
}

void dumpBufferToFile(uint8_t* begin, uint32_t size, std::string file)
{
    std::ofstream out;
    out.open(file, std::ios::out | std::ios::binary);
    out.write(reinterpret_cast<char*>(begin), size);
}

void DPSerial::dumpBuffersToFile()
{
    dumpBufferToFile(s_headerBuffer, c_headerSize, "dumpheader.bin");
    dumpBufferToFile(s_packetBuffer, c_packetSize, "dumppacket.bin");
}
