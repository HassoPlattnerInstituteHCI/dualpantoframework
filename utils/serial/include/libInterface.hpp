#pragma once

#include <cstdint>

#include "serial.hpp"
#include "serial_export.hpp"

// class stuff

class CppLib : DPSerial
{
public:
    static uint32_t getRevision();
    static uint64_t open(char* port);
    static void setActiveHandle(uint64_t handle);
    static void close();
    static void poll();
    static void sendSyncAck();
    static void sendHeartbeatAck();
    static void sendMotor(uint8_t controlMethod, uint8_t pantoIndex, float positionX, float positionY, float rotation);
    static void sendSpeed(uint8_t pantoIndex, float speed);
    static void createObstacle(uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    static void createPassableObstacle(uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    static void createRail(uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y, float displacement);
    static void addToObstacle(uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    static void removeObstacle(uint8_t pantoIndex, uint16_t obstacleId);
    static void enableObstacle(uint8_t pantoIndex, uint16_t obstacleId);
    static void disableObstacle(uint8_t pantoIndex, uint16_t obstacleId);
    static void sendFree(uint8_t pantoIndex);
    static void sendFreeze(uint8_t pantoIndex);
    static void sendSpeedControl(uint8_t tethered, float tetherFactor, float tetherInnerRadius, float tetherOuterRadius, uint8_t strategy, uint8_t pockEnabled);
    static uint32_t checkSendQueue(uint32_t maxPackets);
    static void reset();
};

// handlers

typedef void (*syncHandler_t)(uint64_t);
extern syncHandler_t syncHandler;
typedef void (*heartbeatHandler_t)(uint64_t);
extern heartbeatHandler_t heartbeatHandler;
typedef void (*positionHandler_t)(uint64_t, double*);
extern positionHandler_t positionHandler;
typedef void (*loggingHandler_t)(char*);
extern loggingHandler_t loggingHandler;
typedef void (*transitionHandler_t)(uint8_t);
extern transitionHandler_t transitionHandler;

void logString(char* msg);

// can't export any member functions, not even static ones
// thus we'll have to add wrappers for everything

extern "C"
{
    uint32_t SERIAL_EXPORT GetRevision();
    void SERIAL_EXPORT SetSyncHandler(syncHandler_t handler);
    void SERIAL_EXPORT SetHeartbeatHandler(heartbeatHandler_t handler);
    void SERIAL_EXPORT SetPositionHandler(positionHandler_t handler);
    void SERIAL_EXPORT SetLoggingHandler(loggingHandler_t handler);
    void SERIAL_EXPORT SetTransitionHandler(transitionHandler_t handler);
    uint64_t SERIAL_EXPORT Open(char* port);
    void SERIAL_EXPORT Close(uint64_t handle);
    void SERIAL_EXPORT Poll(uint64_t handle);
    void SERIAL_EXPORT SendSyncAck(uint64_t handle);
    void SERIAL_EXPORT SendHeartbeatAck(uint64_t handle);
    void SERIAL_EXPORT SendMotor(uint64_t handle, uint8_t controlMethod, uint8_t pantoIndex, float positionX, float positionY, float rotation);
    void SERIAL_EXPORT SendSpeed(uint64_t handle, uint8_t pantoIndex, float speed);
    void SERIAL_EXPORT FreeMotor(uint64_t handle, uint8_t pantoIndex);
    void SERIAL_EXPORT FreezeMotor(uint64_t handle, uint8_t pantoIndex);
    void SERIAL_EXPORT CreateObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    void SERIAL_EXPORT CreatePassableObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    void SERIAL_EXPORT CreateRail(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y, float displacement);
    void SERIAL_EXPORT AddToObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    void SERIAL_EXPORT RemoveObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId);
    void SERIAL_EXPORT EnableObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId);
    void SERIAL_EXPORT DisableObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId);
    void SERIAL_EXPORT SetSpeedControl(uint64_t handle, uint8_t tethered, float tetherFactor, float tetherInnerRadius, float tetherOuterRadius, uint8_t strategy, uint8_t pockEnabled);
    uint32_t SERIAL_EXPORT CheckQueuedPackets(uint32_t maxPackets);
    void SERIAL_EXPORT Reset();
};
