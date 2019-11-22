#pragma once

#include "serial.hpp"

class Standalone : public DPSerial
{
public:
    static bool setup(std::string path);
    static void terminate(int signal);
    static void printPacket();
};
