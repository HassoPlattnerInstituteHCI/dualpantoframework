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
    std::vector<uint16_t> m_values;
    std::vector<uint16_t> m_zeros;
    uint32_t errors = 0;
    uint32_t requests = 0;
    uint8_t m_maxTries = 4;
    uint8_t m_currentTry = 0;
    // static const uint32_t c_hspiSsPin = 15;

    static const uint32_t c_hspiSsPin1 = 15;
    static const uint32_t c_hspiSsPin2 = 5;
    static const uint16_t c_nop = 0x0;
    static const uint16_t c_clearError = 0x4001;
    static const uint16_t c_readAngle = 0xFFFF;
    static const uint16_t c_dataMask = 0x3FFF;

    void begin();
    void end();
    std::vector<uint16_t> getZero();
    void transfer(uint16_t transmission);
    void setZero(std::vector<uint16_t> newZero);
public:
    SPIEncoderChain(uint32_t numberOfEncoders);
    void update(int channel);
    void update();
    void clearError();
    void setZero();
    bool needsZero();
    void wakeUp();
    void __setZeros();
    void setPosition(std::vector<uint16_t> positions);
    uint32_t getErrors();
    uint32_t getRequests();
    void resetErrors();
    AngleAccessor getAngleAccessor(uint32_t index);
};