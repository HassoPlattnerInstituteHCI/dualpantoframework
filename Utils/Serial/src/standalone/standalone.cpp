#include <string>
#include <iomanip>
#include <iostream>
#include <fstream>

#include "standalone.hpp"

void Standalone::terminate(int signal)
{
    tearDown();
    exit(0);
}

void Standalone::printPacket()
{
    receivePacket();
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