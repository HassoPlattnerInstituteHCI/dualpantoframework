#include "packet.hpp"

Packet::Packet(uint8_t messageType, uint16_t payloadSize)
{
    header.MessageType = messageType;
    header.PayloadSize = payloadSize;
}

uint8_t Packet::receiveUInt8()
{
    return payload[payloadIndex++];
}

int16_t Packet::receiveInt16()
{
    uint8_t temp[2];
    for (auto i = 0; i < 2; ++i)
    {
        temp[i] = payload[payloadIndex + i];
    }
    payloadIndex += 2;
    return temp[0] << 8 | temp[1];
}

uint16_t Packet::receiveUInt16()
{
    auto temp = receiveInt16();
    return *reinterpret_cast<uint16_t *>(&temp);
}

int32_t Packet::receiveInt32()
{
    uint8_t temp[4];
    for (auto i = 0; i < 4; ++i)
    {
        temp[i] = payload[payloadIndex + i];
    }
    payloadIndex += 4;
    return temp[0] << 24 | temp[1] << 16 | temp[2] << 8 | temp[3];
}

uint32_t Packet::receiveUInt32()
{
    auto temp = receiveInt32();
    return *reinterpret_cast<uint32_t *>(&temp);
}

float Packet::receiveFloat()
{
    auto temp = receiveInt32();
    return *reinterpret_cast<float *>(&temp);
}

void Packet::sendUInt8(uint8_t value)
{
    payload[payloadIndex++] = value;
}

void Packet::sendInt16(int16_t value)
{
    payload[payloadIndex++] = value >> 8;
    payload[payloadIndex++] = value & 255;
}

void Packet::sendUInt16(uint16_t value)
{
    sendInt16(*reinterpret_cast<int16_t *>(&value));
}

void Packet::sendInt32(int32_t value)
{
    payload[payloadIndex++] = value >> 24;
    payload[payloadIndex++] = (value >> 16) & 255;
    payload[payloadIndex++] = (value >> 8) & 255;
    payload[payloadIndex++] = value & 255;
}

void Packet::sendUInt32(uint32_t value)
{
    sendInt32(*reinterpret_cast<int32_t *>(&value));
}

void Packet::sendFloat(float value)
{
    sendInt32(*reinterpret_cast<int32_t *>(&value));
}