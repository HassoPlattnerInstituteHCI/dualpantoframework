#pragma once

#include <Arduino.h>

struct SPIPacket
{
    bool m_parity;
    bool m_flag;
    uint16_t m_data;
    bool m_valid;
    uint16_t m_transmission;
    static const uint16_t c_parityMask = 0x8000;
    static const uint16_t c_flagMask = 0x4000;
    static const uint16_t c_dataMask = 0x3FFF;
    SPIPacket(bool flag, uint16_t data);
    SPIPacket(uint16_t transmisson);
    SPIPacket() = default;
    bool calcParity();
    bool parityError();
    bool commandInvalidError();
    bool framingError();
};
