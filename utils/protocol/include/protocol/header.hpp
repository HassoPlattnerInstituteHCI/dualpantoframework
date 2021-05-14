#pragma once

#ifdef ARDUINO
#include <Arduino.h>
#else
#include <cstdint>
#endif

struct Header
{
    uint8_t MessageType = 0;
    uint8_t PacketId = 0;
    uint16_t PayloadSize = 0;
};
