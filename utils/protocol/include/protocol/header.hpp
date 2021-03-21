#pragma once

#ifdef ARDUINO
#include <Arduino.h>
#else
#include <cstdint>
#endif

struct Header
{
    uint8_t MessageType;
    uint8_t PacketId;
    uint16_t PayloadSize;
};
