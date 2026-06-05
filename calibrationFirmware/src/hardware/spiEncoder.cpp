#include <hardware/spiEncoder.hpp>

SPIEncoder::SPIEncoder(SPIClass* spi) : m_spi(spi) { };

void SPIEncoder::transfer(uint16_t transmission)
{
    m_lastPacket = SPIPacket(m_spi->transfer16(transmission));
}

uint32_t SPIEncoder::getAngle()
{
    return m_lastValidAngle;
    
}
// uint32_t SPIEncoder::getAngle(uint32_t index)
// {
//     return m_values[index];// & c_dataMask;
// }
