#pragma once

#ifdef ARDUINO
#include <Arduino.h>
#endif

class DPProtocol
{
protected:
    // revision
    static const uint32_t c_revision = 0;

    // magic number
    static const int c_magicNumber[];
    static const int c_magicNumberSize; // set in cpp alongside magic number to avoid incomplete changes

    // header
    struct Header
    {
        uint8_t MessageType;
        uint32_t PayloadSize;
    };
    static const int c_headerSize = 5;

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