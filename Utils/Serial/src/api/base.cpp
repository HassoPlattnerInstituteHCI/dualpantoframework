#include "api/base.hpp"

void dumpBuffer(uint8_t* begin, uint32_t size)
{
    const uint32_t bytesPerLine = 16;
    uint32_t index = 0;

    std::cout << std::hex << std::uppercase << std::setfill('0');

    while(index < size)
    {
        std::cout << "0x" << std::setw(8) << index << " |";
        for(auto i = 0u; i < bytesPerLine && index + i < size; ++i)
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
    out.write(reinterpret_cast<char *>(begin), size);
}

void DPSerial::dumpBuffersToFile()
{
    dumpBufferToFile(s_headerBuffer, c_headerSize, "dumpheader.bin");
    dumpBufferToFile(s_packetBuffer, c_packetSize, "dumppacket.bin");
}