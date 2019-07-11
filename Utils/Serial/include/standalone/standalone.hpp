#pragma once

#include "serial.hpp"

class Standalone : public DPSerial
{
public:
    static void terminate(int signal);
    static void printPacket();
};
