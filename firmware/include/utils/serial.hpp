#pragma once

#include <map>
#include <queue>
#include <string>

#include <protocol/header.hpp>
#include <protocol/messageType.hpp>
#include <protocol/protocol.hpp>

#include "utils/receiveHandler.hpp"
#include "utils/receiveState.hpp"

class DPSerial : DPProtocol
{
private:
    // data storage
    static Header s_header;
    static const uint16_t c_debugLogBufferSize = 256;
    static uint8_t s_debugLogBuffer[c_debugLogBufferSize];
    static std::queue<std::string> s_debugLogQueue;
    static const uint16_t c_processedQueuedMessagesPerFrame = 4;

    // multithreading safety
    static portMUX_TYPE s_serialMutex;
    
    static ReceiveState s_receiveState;

    // connection
    static bool s_connected;
    static const uint16_t c_heartbeatIntervalMs = 1000;
    static unsigned long s_lastHeartbeatTime;
    static const uint16_t c_maxUnacklowledgedHeartbeats = 5;
    static uint16_t s_unacknowledgedHeartbeats;

    // send helper
    static void sendUInt8(uint8_t data);
    static void sendInt16(int16_t data);
    static void sendUInt16(uint16_t data);
    static void sendInt32(int32_t data);
    static void sendUInt32(uint32_t data);
    static void sendFloat(float data);
    static void sendMessageType(MessageType data);
    static void sendMagicNumber();
    static void sendHeader(MessageType messageType, uint16_t payloadSize);
    
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
    static void receiveAddToObstacle();
    static void receiveRemoveObstacle();
    static void receiveEnableObstacle();
    static void receiveDisableObstacle();
    static void receiveCalibrationRequest();
    static void receiveDumpHashtable();
    static void receiveInvalid();

    // map of receive handlers
    static std::map<MessageType, ReceiveHandler> s_receiveHandlers;
public:
    // delete contructor - this class only contains static members
    DPSerial() = delete;

    // setup
    static void init();
    static bool ensureConnection();

    // send
    static void sendPosition();
    static void sendInstantDebugLog(const char* message, ...);
    static void sendQueuedDebugLog(const char* message, ...);
    static void processDebugLogQueue();
    static void sendDebugData();

    // receive
    static void receive();
};
