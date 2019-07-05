#pragma once

#include <SPI.h>

#include "hardware/spiPacket.hpp"

class SPIEncoder
{
    friend class SPIEncoderChain;
private:
    SPIPacket m_lastPacket;
    uint16_t m_lastValidAngle;
    SPIClass* m_spi;
    SPIEncoder() = default;
    SPIEncoder(SPIClass* spi);
    void transfer(uint16_t transmisson);
public:
    uint32_t getAngle();
};
