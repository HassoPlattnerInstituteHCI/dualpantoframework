#include "hardware/spiEncoderChain.hpp"

#include "hardware/spiCommands.hpp"
#include "utils/serial.hpp"
#include <EEPROM.h>

void SPIEncoderChain::begin()
{
    m_spi.beginTransaction(m_settings);
    digitalWrite(c_hspiSsPin1, LOW);
}

void SPIEncoderChain::end()
{
    digitalWrite(c_hspiSsPin1, HIGH);
    m_spi.endTransaction();

    delay(1);
}

// void SPIEncoderChain::transfer(uint16_t transmission)
// {
//     begin();
//     for(auto i = 0; i < m_numberOfEncoders; ++i)
//     {
//         m_encoders[i].transfer(transmission);
//     }
//     end();
// }

void SPIEncoderChain::transfer(uint16_t transmission)
{

    //upperhandle
    digitalWrite(c_hspiSsPin1, HIGH);
    digitalWrite(c_hspiSsPin2, HIGH);
	m_spi.beginTransaction(m_settings);
	digitalWrite(c_hspiSsPin1, LOW);
    for(auto i = 0; i < m_numberOfEncoders/2; ++i)
    {
        m_encoders[i].transfer(transmission);
    }
	digitalWrite(c_hspiSsPin1, HIGH);
	// m_spi.endTransaction();

    //lower handle
	// m_spi.beginTransaction(m_settings);
	digitalWrite(c_hspiSsPin2, LOW);
	for (auto i = 0; i < m_numberOfEncoders / 2; ++i)
	{
		m_encoders[i+2].transfer(transmission);
	}
	digitalWrite(c_hspiSsPin2, HIGH);
	m_spi.endTransaction();
}

void SPIEncoderChain::setZero(std::vector<uint16_t> newZero)
{
    transfer(SPICommands::c_highZeroWrite);


    // begin();
    // for(auto i = 0; i < m_numberOfEncoders; ++i)
    // {
    //     m_encoders[i].transfer(SPIPacket(0, newZero[i] >> 6).m_transmission);
    // }
    // end();
    //upperhandle
	m_spi.beginTransaction(m_settings);
	digitalWrite(c_hspiSsPin1, LOW);
    for(auto i = 0; i < m_numberOfEncoders/2; ++i)
    {
        m_encoders[i].transfer(SPIPacket(0, newZero[i] >> 6).m_transmission);
    }
	digitalWrite(c_hspiSsPin1, HIGH);
	// m_spi.endTransaction();

    //lower handle
	// m_spi.beginTransaction(m_settings);
	digitalWrite(c_hspiSsPin2, LOW);
	for (auto i = 0; i < m_numberOfEncoders / 2; ++i)
	{
		m_encoders[i+2].transfer(SPIPacket(0, newZero[i+2] >> 6).m_transmission);
	}
	digitalWrite(c_hspiSsPin2, HIGH);
	m_spi.endTransaction();

    transfer(SPICommands::c_lowZeroWrite);

    // begin();
    // for(auto i = 0; i < m_numberOfEncoders; ++i)
    // {
    //     m_encoders[i].transfer(SPIPacket(0, newZero[i] & 0b111111).m_transmission);
    // }
    // end();

    m_spi.beginTransaction(m_settings);
	digitalWrite(c_hspiSsPin1, LOW);
    for(auto i = 0; i < m_numberOfEncoders/2; ++i)
    {
        m_encoders[i].transfer(SPIPacket(0, newZero[i] & 0b111111).m_transmission);
    }
	digitalWrite(c_hspiSsPin1, HIGH);
	// m_spi.endTransaction();

    //lower handle
	// m_spi.beginTransaction(m_settings);
	digitalWrite(c_hspiSsPin2, LOW);
	for (auto i = 0; i < m_numberOfEncoders / 2; ++i)
	{
		m_encoders[i+2].transfer(SPIPacket(0, newZero[i+2] & 0b111111).m_transmission);
	}
	digitalWrite(c_hspiSsPin2, HIGH);
	m_spi.endTransaction();

    // for(auto i = 0; i < m_numberOfEncoders; ++i)
    // {
    //     EEPROM.writeInt((i*sizeof(int32_t)),newZero[i] & 0x3fff);
    // }
    // EEPROM.commit();
    transfer(SPICommands::c_readAngle);
}

SPIEncoderChain::SPIEncoderChain(uint32_t numberOfEncoders)
: m_settings(10000000, SPI_MSBFIRST, SPI_MODE1) //was 100000
, m_spi(HSPI)
, m_numberOfEncoders(numberOfEncoders)
, m_encoders(numberOfEncoders, &m_spi)
, m_values(2 * 2)
, m_zeros(m_numberOfEncoders)
{
    m_spi.begin();
    pinMode(c_hspiSsPin1, OUTPUT);
    pinMode(c_hspiSsPin2, OUTPUT);
    pinMode(13, OUTPUT);
    clearError();
    __setZeros();
    update();
}

void SPIEncoderChain::__setZeros(){
    for(int i=0 ; i < 4; i++)m_zeros[i]=0;
    update();
    for(int i=0 ; i < 4; i++){
        m_zeros[i] = m_encoders[i].m_lastValidAngle;
    }
    // Serial.println("Zeros");

    DPSerial::sendQueuedDebugLog("Zeros");
   
    for(int i=0 ; i < 4; i++){
        // Serial.println(m_zeros[i]);
        DPSerial::sendQueuedDebugLog("zero %u reported=%u", m_zeros[i], m_encoders[i].m_lastValidAngle);
    }
}

void SPIEncoderChain::update()
{
    update(0);
    update(1);
}

void SPIEncoderChain::update(int channel)
{
    uint16_t buf = 0;
    m_spi.beginTransaction(m_settings);
    //pinMode(13, OUTPUT);
    digitalWrite(13, HIGH);
    if(channel == 0) digitalWrite(c_hspiSsPin1, LOW);
    else if(channel == 1) digitalWrite(c_hspiSsPin2, LOW);
    for(auto i = 0; i < m_values.size()/2; ++i)
    {
        m_spi.transfer16(c_readAngle);
    }
    digitalWrite(c_hspiSsPin1, HIGH);
    digitalWrite(c_hspiSsPin2, HIGH);

    delayMicroseconds(1);

    if(channel == 0) digitalWrite(c_hspiSsPin1, LOW);
    else if(channel == 1) digitalWrite(c_hspiSsPin2, LOW);
    for(auto i = 0; i < m_values.size()/2; ++i)
    {
        buf = m_spi.transfer16(c_nop);
        m_values[i + channel*2] = buf & c_dataMask;
      //  Serial.printf("m_values%d\t%d\n", i, m_values[i + channel*2]);
      //  Serial.println();
    }
    digitalWrite(c_hspiSsPin1, HIGH);
    digitalWrite(c_hspiSsPin2, HIGH);

    m_spi.endTransaction();

    for(int i=0; i < 4; i++){
        m_encoders[i].m_lastValidAngle = m_values[i];
        // DPSerial::sendQueuedDebugLog("zero %u reported=%u", m_zeros[i], m_encoders[i].m_lastValidAngle);
    }
}

void SPIEncoderChain::clearError()
{
    m_spi.beginTransaction(m_settings);
    digitalWrite(c_hspiSsPin1, LOW);
    for(auto i = 0; i < m_values.size(); ++i)
    {
        m_spi.transfer16(c_clearError);
    }
    digitalWrite(c_hspiSsPin1, HIGH);


    //Serial.println("Error registers:");
    digitalWrite(c_hspiSsPin1, LOW);
    for(auto i = 0; i < m_values.size(); ++i)
    {
        m_spi.transfer16(c_nop);
        m_spi.transfer16(c_nop);
        //Serial.println(m_spi.transfer16(c_nop));
        //Serial.println(m_spi.transfer16(c_nop));
    }
    digitalWrite(c_hspiSsPin1, HIGH);
    m_spi.endTransaction();

}

std::vector<uint16_t> SPIEncoderChain::getZero() //getZero returns 0 everytime power == off.
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

    // for(auto i = 0; i < m_numberOfEncoders; ++i)
    // {
    //     result[i] = (uint16_t)EEPROM.readInt(i*sizeof(int32_t));
    // }

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

void SPIEncoderChain::wakeUp(){ //call setZero(EEPROM_VALUE)
    std::vector<uint16_t> result(m_numberOfEncoders);
    update();
    for(auto i = 0; i < m_numberOfEncoders; ++i)
    {
        result[i] = (uint16_t)EEPROM.readInt(i*sizeof(int32_t));
    }
    setZero(result);
}

AngleAccessor SPIEncoderChain::getAngleAccessor(uint32_t index)
{
    return std::bind(&SPIEncoder::getAngle, &m_encoders[index]);
}

uint32_t SPIEncoderChain::getErrors() {    
    return errors;
}

uint32_t SPIEncoderChain::getRequests() {
    return requests;
}

void SPIEncoderChain::resetErrors() {
    errors = 0;
    requests = 0;
}