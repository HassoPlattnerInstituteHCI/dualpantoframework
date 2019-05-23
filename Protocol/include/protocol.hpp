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
    static const uint32_t c_revision = 2;

    // connection info
    static const uint32_t c_baudRate = 115200;

    // magic number
    static const uint8_t c_magicNumber[];
    static const uint8_t c_magicNumberSize = 2;

    // header
    struct Header
    {
        uint8_t MessageType;
        uint16_t PayloadSize;
    };
    static const uint8_t c_headerSize = 3;
    static const uint16_t c_maxPayloadSize = 256;

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
        PID = 0x91,
        CREATE_OBSTACLE = 0xA0,
        ADD_TO_OBSTACLE = 0xA1,
        REMOVE_OBSTACLE = 0xA2,
        ENABLE_OBSTACLE = 0xA3,
        DISABLE_OBSTACLE = 0xA4,
        DUMP_HASHTABLE = 0xC0
    };
};
