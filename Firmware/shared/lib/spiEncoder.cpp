#include <spiEncoder.hpp>

#include <Arduino.h>
#include <serial.hpp>

SPIPacket::SPIPacket(bool flag, uint16_t data)
: m_flag(flag)
, m_data(data & c_dataMask)
, m_valid(true)
{
    m_parity = calcParity();
    m_transmission = m_data | (m_flag << 14) | (m_parity << 15);
}

SPIPacket::SPIPacket(uint16_t transmission)
: m_transmission(transmission)
{
    m_parity = m_transmission & c_parityMask;
    m_flag = m_transmission & c_flagMask;
    m_data = m_transmission & c_dataMask;
    m_valid = m_parity == calcParity();
}

bool SPIPacket::calcParity()
{
    uint16_t temp = (m_data & c_dataMask) | (m_flag << 14);
    // calculate https://en.wikipedia.org/wiki/Hamming_weight
    temp -= (temp >> 1) & 0b0101010101010101;
    temp = (temp & 0b0011001100110011) + ((temp >> 2) & 0b0011001100110011);
    temp = (temp + (temp >> 4)) & 0b0000111100001111;
    return ((temp * 0b0000000100000001) >> 8) % 2;
}

bool SPIPacket::parityError()
{
    return m_data & 0b100;
}

bool SPIPacket::commandInvalidError()
{
    return m_data & 0b10;
}

bool SPIPacket::framingError()
{
    return m_data & 0b1;
}

const uint16_t SPICommands::c_readAngle = SPIPacket(1, 0x3FFF).m_transmission;
const uint16_t SPICommands::c_clearError = SPIPacket(1, 0x1).m_transmission;
const uint16_t SPICommands::c_nop = SPIPacket(0, 0x0).m_transmission;
const uint16_t SPICommands::c_highZeroRead = SPIPacket(1, 0x16).m_transmission;
const uint16_t SPICommands::c_lowZeroRead = SPIPacket(1, 0x17).m_transmission;
const uint16_t SPICommands::c_highZeroWrite = SPIPacket(0, 0x16).m_transmission;
const uint16_t SPICommands::c_lowZeroWrite = SPIPacket(0, 0x17).m_transmission;

SPIEncoder::SPIEncoder(SPIClass* spi) : m_spi(spi) { };

void SPIEncoder::transfer(uint16_t transmission)
{
    m_lastPacket = SPIPacket(m_spi->transfer16(transmission));
    //DPSerial::sendDebugLog("%04X >>> %04X", transmission, m_lastPacket.m_transmission);
}

uint32_t SPIEncoder::getAngle()
{
    return m_lastValidAngle;
}

void SPIEncoderChain::begin()
{
    m_spi.beginTransaction(m_settings);
    digitalWrite(c_hspiSsPin, LOW);
}

void SPIEncoderChain::step()
{
    digitalWrite(c_hspiSsPin, HIGH);
    delay(1); // TODO: remove or make smaller
    digitalWrite(c_hspiSsPin, LOW);
}

void SPIEncoderChain::end()
{
    digitalWrite(c_hspiSsPin, HIGH);
    m_spi.endTransaction();
    delay(1); // TODO: remove or make smaller
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
    //DPSerial::sendDebugLog("setZero(std::vector<uint16_t> newZero)");
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
: m_settings(1000000, SPI_MSBFIRST, SPI_MODE1)
, m_spi(HSPI)
, m_numberOfEncoders(numberOfEncoders)
, m_encoders(numberOfEncoders, &m_spi)
{
    m_spi.begin();
    pinMode(c_hspiSsPin, OUTPUT);
    //DPSerial::sendDebugLog("initial clearError");
    clearError();
    //DPSerial::sendDebugLog("initial update");
    update();
}

void SPIEncoderChain::update()
{
    transfer(SPICommands::c_readAngle);
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
            DPSerial::sendDebugLog("Encoder %i received %04x", i, m_encoders[i].m_lastPacket.m_transmission);
        }
    }

    if(!allValid)
    {
        DPSerial::sendDebugLog("Transmission error - resetting error register...");
        clearError();
    }
}

void SPIEncoderChain::clearError()
{
    //DPSerial::sendDebugLog("request clear, don't care about return value");
    // first pass - request clear, don't care about return value
    transfer(SPICommands::c_clearError);

    //DPSerial::sendDebugLog("don't care about request, return value contains error flags");
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
            DPSerial::sendDebugLog("Encoder %u reported parity=%u, command=%u, framing=%u", i, parityError, commandInvalidError, framingError);
        }
    }

    //DPSerial::sendDebugLog("request angle again as preparation for next update, don't care about return value - it's just the empty registers");
    // third pass - request angle again as preparation for next update, don't care about return value - it's just the empty registers
    transfer(SPICommands::c_readAngle);
}

std::vector<uint16_t> SPIEncoderChain::getZero()
{
    //DPSerial::sendDebugLog("getZero()");
    // first pass - request high part of zero, don't care about current return value
    transfer(SPICommands::c_highZeroRead);

    // second pass - request low part of zero, the return value contains the high part
    transfer(SPICommands::c_lowZeroRead);

    std::vector<uint16_t> result(m_numberOfEncoders);

    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        result[i] = m_encoders[i].m_lastPacket.m_data << 6;
    }

    // third pass - request angle again as preparation for next update, the return value contains the low part
    transfer(SPICommands::c_readAngle);

    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        result[i] |= m_encoders[i].m_lastPacket.m_data & 0b111111;
    }

    return result;
}

void SPIEncoderChain::setZero()
{
    //DPSerial::sendDebugLog("setZero()");
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
    //DPSerial::sendDebugLog("needsZero()");
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
    //DPSerial::sendDebugLog("setPosition(std::vector<uint16_t> positions)");
    auto currentZero = getZero();
    update();

    std::vector<uint16_t> newZero(m_numberOfEncoders);

    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        newZero[i] = currentZero[i] + m_encoders[i].m_lastValidAngle;
        newZero[i] -= positions[i];
        DPSerial::sendDebugLog("cz: %i, la: %i, po: %i, nz: %i", currentZero[i], m_encoders[i].m_lastValidAngle, positions[i], newZero[i]);
    }

    setZero(newZero);
}

std::function<uint32_t()> SPIEncoderChain::getAngleAccessor(uint32_t index)
{
    return std::bind(&SPIEncoder::getAngle, &m_encoders[index]);
}
