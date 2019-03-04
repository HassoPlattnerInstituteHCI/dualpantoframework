#pragma once

#ifdef ARDUINO
#include <Arduino.h>
#else
#include <cstdint>
#endif

class DPProtocol
{
protected:
    // revision
    static const uint32_t c_revision = 0;

    // magic number
    static const uint8_t c_magicNumber[];
    static const uint8_t c_magicNumberSize = 2;

    // header
    struct Header
    {
        uint8_t MessageType;
        uint32_t PayloadSize;
    };
    static const uint8_t c_headerSize = 5;

    // message types
    enum MessageType
    {
        SYNC = 0x00,
        HEARTBEAT = 0x01,
        POSITION = 0x10,
        DEBUG_LOG = 0x20,
        SYNC_ACK = 0x80,
        HEARTBEAT_ACK = 0x81,
        MOTOR = 0x90,
        PID = 0x91
    };
};