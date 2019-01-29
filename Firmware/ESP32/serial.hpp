#pragma once

#include <Arduino.h>
#include <string>

class DPSerial
{
private:
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
    static Header s_header;

    // receive state
    enum ReceiveState
    {
        NONE = 0,
        FOUND_MAGIC = 1,
        FOUND_HEADER = 2
    };
    static ReceiveState s_receiveState;

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

    // connection
    static bool s_connected;
    static const int c_heartbeatIntervalMs = 1000;
    static const int c_maxUnacklowledgedHeartbeats = 5;
    static int s_unacknowledgedHeartbeats;

    // send helper
    static void sendUInt8(uint8_t data);
    static void sendInt32(int32_t data);
    static void sendUInt32(uint32_t data);
    static void sendFloat(float data);
    static void sendMessageType(MessageType data);
    static void sendMagicNumber();
    static void sendHeader(MessageType messageType, uint32_t payloadSize);
    
    // send
    static void sendSync();
    static void sendHeartbeat();

    // receive helper
    static uint8_t receiveUInt8();
    static int32_t receiveInt32();
    static uint32_t receiveUInt32();
    static float receiveFloat();
    static MessageType receiveMessageType();
    static bool receiveMagicNumber();
    static bool receiveHeader();
    static bool payloadReady();

    // receive
    static void receiveSyncAck();
    static void receiveHearbeatAck();
    static void receiveMotor();
    static void receivePID();
    static void receiveInvalid();
public: 
    // send
    static void sendPosition();
    static void sendDebugLog(std::string message);

    // receive
    static void receive();

    static void testSend();
};
