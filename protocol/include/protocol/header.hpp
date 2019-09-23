#pragma once

#ifdef ARDUINO
#include <Arduino.h>
#else
#include <cstdint>
#endif

struct Header
{
    uint8_t MessageType;
    uint16_t PayloadSize;
};
