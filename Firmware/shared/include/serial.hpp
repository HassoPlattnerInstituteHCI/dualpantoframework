#pragma once

#include <Arduino.h>
#include <string>
#include <map>
#include <functional>
#include "protocol.hpp"

class DPSerial : DPProtocol
{
private:
    // data storage
    static Header s_header;
    static const uint8_t c_debugLogBufferSize = 255;
    static uint8_t s_debugLogBuffer[c_debugLogBufferSize];

    // multithreading safety
    static portMUX_TYPE s_serialMutex;
     
    // receive state
    enum ReceiveState
    {
        NONE = 0,
        FOUND_MAGIC = 1,
        FOUND_HEADER = 2
    };
    static ReceiveState s_receiveState;

    // connection
    static bool s_connected;
    static const int c_heartbeatIntervalMs = 1000;
    static unsigned long s_lastHeartbeatTime;
    static const int c_maxUnacklowledgedHeartbeats = 5;
    static int s_unacknowledgedHeartbeats;

    // send helper
    static void sendUInt8(uint8_t data);
    static void sendInt16(int16_t data);
    static void sendUInt16(uint16_t data);
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
    static int16_t receiveInt16();
    static uint16_t receiveUInt16();
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
    static void receiveCreateObstacle();
    static void receiveRemoveObstacle();
    static void receiveEnableObstacle();
    static void receiveDisableObstacle();
    static void receiveInvalid();

    // map of receive handlers
    static std::map<DPProtocol::MessageType, std::function<void()>> s_receiveHandlers;
public:
    // setup
    static bool ensureConnection();

    // send
    static void sendPosition();
    static void sendDebugLog(const char* message, ...);
    static void sendDebugData();

    // receive
    static void receive();
};
