#pragma once

#include <SPI.h>
#include <vector>
#include <functional>

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

namespace SPICommands
{
    const uint16_t c_readAngle;
    const uint16_t c_clearError;
    const uint16_t c_nop;
    const uint16_t c_highZeroRead;
    const uint16_t c_lowZeroRead;
    const uint16_t c_highZeroWrite;
    const uint16_t c_lowZeroWrite;
};

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
    void setZero(std::vector<uint16_t> newZero);
public:
    SPIEncoderChain(uint32_t numberOfEncoders);
    void update();
    void clearError();
    void setZero();
    bool needsZero();
    void setPosition(std::vector<uint16_t> positions);
    std::function<uint32_t()> getAngleAccessor(uint32_t index);
};
