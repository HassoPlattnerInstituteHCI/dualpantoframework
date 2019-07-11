#include "api/standalone.hpp"

#include <string>
#include <iomanip>
#include <iostream>
#include <fstream>

void Standalone::terminate(int signal)
{
    tearDown();
    exit(0);
}

void Standalone::printPacket()
{
    DPSerial::receivePacket();
    for (auto i = 0; i < c_headerSize; ++i)
    {
        std::cout << std::setw(2) << (int)s_headerBuffer[i] << " ";
    }
    std::cout << "| ";
    for (auto i = 0; i < s_header.PayloadSize; ++i)
    {
        std::cout << std::setw(2) << (int)s_packetBuffer[i] << " ";
    }
    std::cout << std::endl;
}

int main(int argc, char **argv)
{
    if (argc != 2)
    {
        fprintf(stderr, "Expected /dev/serialport\n");
        return -1;
    }
    if (!DPSerial::setup(argv[1]))
    {
        fprintf(stderr, "Could not open %s\n", argv[1]);
        return -2;
    }
    signal(SIGINT, &(DPSerial::terminate));

    // cin/cout to hex mode
    std::cout << std::hex << std::uppercase << std::setfill('0');

    while (true)
    {
        DPSerial::printPacket();
    }

    return 0;
}