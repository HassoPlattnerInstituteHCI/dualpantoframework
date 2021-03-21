#pragma once

#include <set>

enum MessageType
{
    SYNC = 0x00,
    HEARTBEAT = 0x01,
    BUFFER_CRITICAL = 0x02,
    BUFFER_READY = 0x03,
    PACKET_ACK = 0x04,
    INVALID_PACKET_ID = 0x05,
    INVALID_DATA = 0x06,
    POSITION = 0x10,
    DEBUG_LOG = 0x20,
    SYNC_ACK = 0x80,
    HEARTBEAT_ACK = 0x81,
    MOTOR = 0x90,
    PID = 0x91,
    SPEED = 0x92,
    TRANSITION_ENDED = 0x93,
    CREATE_OBSTACLE = 0xA0,
    ADD_TO_OBSTACLE = 0xA1,
    REMOVE_OBSTACLE = 0xA2,
    ENABLE_OBSTACLE = 0xA3,
    DISABLE_OBSTACLE = 0xA4,
    CALIBRATE_PANTO = 0xA5,
    CREATE_PASSABLE_OBSTACLE = 0xA6,
    CREATE_RAIL = 0xA7,
    FREEZE = 0xA8,
    FREE = 0xA9,
    SPEED_CONTROL = 0xAA,
    DUMP_HASHTABLE = 0xC0,
};

extern std::set<MessageType> TrackedMessageTypes;
