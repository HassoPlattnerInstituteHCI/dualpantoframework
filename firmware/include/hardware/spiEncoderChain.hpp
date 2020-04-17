#pragma once

#include <SPI.h>
#include <vector>

#include "hardware/angleAccessor.hpp"
#include "hardware/spiEncoder.hpp"

class SPIEncoderChain
{
private:
    SPISettings m_settings;
    SPIClass m_spi;
    uint32_t m_numberOfEncoders;
    std::vector<SPIEncoder> m_encoders;
    static const uint32_t c_hspiSsPin = 15;
    void begin();
    void end();
    std::vector<uint16_t> getZero();
    void transfer(uint16_t transmission);
public:
    SPIEncoderChain(uint32_t numberOfEncoders);
    void update();
    void clearError();
    void setZero();
    void setZero(std::vector<uint16_t> newZero);
    bool needsZero();
    void setPosition(std::vector<uint16_t> positions);
    AngleAccessor getAngleAccessor(uint32_t index);
};
