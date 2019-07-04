#include "hardware/spiEncoderChain.hpp"

#include "hardware/spiCommands.hpp"
#include "utils/serial.hpp"

void SPIEncoderChain::begin()
{
    m_spi.beginTransaction(m_settings);
    digitalWrite(c_hspiSsPin, LOW);
}

void SPIEncoderChain::end()
{
    digitalWrite(c_hspiSsPin, HIGH);
    m_spi.endTransaction();
}

void SPIEncoderChain::transfer(uint16_t transmission)
{
    begin();
    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        m_encoders[i].transfer(transmission);
    }
    end();
}

void SPIEncoderChain::setZero(std::vector<uint16_t> newZero)
{
    transfer(SPICommands::c_highZeroWrite);

    begin();
    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        m_encoders[i].transfer(SPIPacket(0, newZero[i] >> 6).m_transmission);
    }
    end();

    transfer(SPICommands::c_lowZeroWrite);

    begin();
    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        m_encoders[i].transfer(SPIPacket(0, newZero[i] & 0b111111).m_transmission);
    }
    end();

    transfer(SPICommands::c_readAngle);
}

SPIEncoderChain::SPIEncoderChain(uint32_t numberOfEncoders)
: m_settings(10000000, SPI_MSBFIRST, SPI_MODE1)
, m_spi(HSPI)
, m_numberOfEncoders(numberOfEncoders)
, m_encoders(numberOfEncoders, &m_spi)
{
    m_spi.begin();
    pinMode(c_hspiSsPin, OUTPUT);
    clearError();
    update();
}

void SPIEncoderChain::update()
{
    // first pass - request position
    transfer(SPICommands::c_readAngle);

    // second pass - receive position, just send nop
    transfer(SPICommands::c_nop);

    bool allValid = true;
    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        allValid &= m_encoders[i].m_lastPacket.m_valid;
        if(m_encoders[i].m_lastPacket.m_valid)
        {
            m_encoders[i].m_lastValidAngle = m_encoders[i].m_lastPacket.m_data;
        }
        else
        {
            DPSerial::sendQueuedDebugLog("Encoder %i received %04x", i, m_encoders[i].m_lastPacket.m_transmission);
        }
    }

    if(!allValid)
    {
        DPSerial::sendQueuedDebugLog("Transmission error - resetting error register...");
        clearError();
    }
}

void SPIEncoderChain::clearError()
{
    // first pass - request clear, don't care about return value
    transfer(SPICommands::c_clearError);

    // second pass - don't care about request, return value contains error flags
    transfer(SPICommands::c_nop);

    bool parityError;
    bool commandInvalidError;
    bool framingError;
    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        parityError = m_encoders[i].m_lastPacket.parityError();
        commandInvalidError = m_encoders[i].m_lastPacket.commandInvalidError();
        framingError = m_encoders[i].m_lastPacket.framingError();

        if(parityError || commandInvalidError || framingError)
        {
            DPSerial::sendQueuedDebugLog("Encoder %u reported parity=%u, command=%u, framing=%u", i, parityError, commandInvalidError, framingError);
        }
    }
}

std::vector<uint16_t> SPIEncoderChain::getZero()
{
    // first pass - request high part of zero, don't care about current return value
    transfer(SPICommands::c_highZeroRead);

    // second pass - request low part of zero, the return value contains the high part
    transfer(SPICommands::c_lowZeroRead);

    std::vector<uint16_t> result(m_numberOfEncoders);

    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        result[i] = m_encoders[i].m_lastPacket.m_data << 6;
    }

    // third pass - jsut send nop, the return value contains the low part
    transfer(SPICommands::c_nop);

    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        result[i] |= m_encoders[i].m_lastPacket.m_data & 0b111111;
    }

    return result;
}

void SPIEncoderChain::setZero()
{
    auto currentZero = getZero();
    update();

    std::vector<uint16_t> newZero(m_numberOfEncoders);

    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        newZero[i] = currentZero[i] + m_encoders[i].m_lastValidAngle;
    }

    setZero(newZero);
}

bool SPIEncoderChain::needsZero()
{
    auto currentZero = getZero();

    bool allZero = true;

    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        allZero &= currentZero[i] == 0;
    }

    transfer(SPICommands::c_readAngle);
    
    return allZero;
}

void SPIEncoderChain::setPosition(std::vector<uint16_t> positions)
{
    auto currentZero = getZero();
    update();

    std::vector<uint16_t> newZero(m_numberOfEncoders);

    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        newZero[i] = currentZero[i] + m_encoders[i].m_lastValidAngle;
        newZero[i] -= positions[i];
    }

    setZero(newZero);
}

AngleAccessor SPIEncoderChain::getAngleAccessor(uint32_t index)
{
    return std::bind(&SPIEncoder::getAngle, &m_encoders[index]);
}
