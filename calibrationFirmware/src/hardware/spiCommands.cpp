#include "hardware/spiCommands.hpp"

#include "hardware/spiPacket.hpp"

const uint16_t SPICommands::c_readAngle = SPIPacket(1, 0x3FFF).m_transmission;
const uint16_t SPICommands::c_clearError = SPIPacket(1, 0x1).m_transmission;
const uint16_t SPICommands::c_nop = SPIPacket(0, 0x0).m_transmission;
const uint16_t SPICommands::c_highZeroRead = SPIPacket(1, 0x16).m_transmission;
const uint16_t SPICommands::c_lowZeroRead = SPIPacket(1, 0x17).m_transmission;
const uint16_t SPICommands::c_highZeroWrite = SPIPacket(0, 0x16).m_transmission;
const uint16_t SPICommands::c_lowZeroWrite = SPIPacket(0, 0x17).m_transmission;
