#pragma once

#include "serial/serial.hpp"

class Standalone : public DPSerial
{
public:
    static void terminate(int signal);
    static void printPacket();
};
