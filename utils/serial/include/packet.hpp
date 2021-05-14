#pragma once

#include <protocol/header.hpp>
#include <protocol/protocol.hpp>

class Packet
{
public:
    Header header;
    uint8_t payload[256];
    uint8_t payloadIndex = 0;

    Packet(uint8_t messageType, uint16_t payloadSize);

    uint8_t receiveUInt8();
    int16_t receiveInt16();
    uint16_t receiveUInt16();
    int32_t receiveInt32();
    uint32_t receiveUInt32();
    float receiveFloat();

    void sendUInt8(uint8_t value);
    void sendInt16(int16_t value);
    void sendUInt16(uint16_t value);
    void sendInt32(int32_t value);
    void sendUInt32(uint32_t value);
    void sendFloat(float value);
};
