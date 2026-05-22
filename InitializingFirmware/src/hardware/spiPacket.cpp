#include "hardware/spiPacket.hpp"

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
