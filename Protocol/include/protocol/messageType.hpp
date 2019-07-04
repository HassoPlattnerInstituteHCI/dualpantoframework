#pragma once

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
