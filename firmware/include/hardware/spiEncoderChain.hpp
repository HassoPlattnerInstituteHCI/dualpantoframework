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
    uint32_t errors = 0;
    uint32_t requests = 0;
    uint8_t m_maxTries = 4;
    uint8_t m_currentTry = 0;
    static const uint32_t c_hspiSsPin = 15;
    void begin();
    void end();
    std::vector<uint16_t> getZero();
    void transfer(uint16_t transmission);
    void setZero(std::vector<uint16_t> newZero);
public:
    SPIEncoderChain(uint32_t numberOfEncoders);
    void update();
    void clearError();
    void setZero();
    bool needsZero();
    void wakeUp();
    void setPosition(std::vector<uint16_t> positions);
    uint32_t getErrors();
    uint32_t getRequests();
    void resetErrors();
    AngleAccessor getAngleAccessor(uint32_t index);
};