#pragma once

#ifdef ARDUINO
#include <Arduino.h>
#else
#include <cstdint>
#endif

class DPProtocol
{
protected:
    // revision
    static const uint32_t c_revision = 2;

    // connection info
    static const uint32_t c_baudRate = 115200;

    // magic number
    static const uint8_t c_magicNumber[];
    static const uint8_t c_magicNumberSize = 2;

    // data size
    static const uint8_t c_headerSize = 3;
    static const uint16_t c_maxPayloadSize = 256;
};
