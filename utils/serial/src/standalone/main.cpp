#include <iostream>
#include <csignal>
#include <iomanip>

#include "standalone.hpp"

int main(int argc, char** argv)
{
    if (argc != 2)
    {
        fprintf(stderr, "Expected /dev/serialport\n");
        return -1;
    }
    if (!Standalone::setup(argv[1]))
    {
        fprintf(stderr, "Could not open %s\n", argv[1]);
        return -2;
    }
    signal(SIGINT, &(Standalone::terminate));

    // cin/cout to hex mode
    std::cout << std::hex << std::uppercase << std::setfill('0');

    while (true)
    {
        Standalone::printPacket();
    }

    return 0;
}