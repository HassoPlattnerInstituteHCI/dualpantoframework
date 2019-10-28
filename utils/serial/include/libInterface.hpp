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
    static void createObstacle (uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    static void addToObstacle (uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    static void removeObstacle (uint8_t pantoIndex, uint16_t obstacleId);
    static void enableObstacle (uint8_t pantoIndex, uint16_t obstacleId);
    static void disableObstacle (uint8_t pantoIndex, uint16_t obstacleId);
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
void log(char* msg);

// can't export any member functions, not even static ones
// thus we'll have to add wrappers for everything

extern "C"
{
    uint32_t SERIAL_EXPORT GetRevision();
    void SERIAL_EXPORT SetSyncHandler(syncHandler_t handler);
    void SERIAL_EXPORT SetHeartbeatHandler(heartbeatHandler_t handler);
    void SERIAL_EXPORT SetPositionHandler(positionHandler_t handler);
    void SERIAL_EXPORT SetLoggingHandler(loggingHandler_t handler);
    uint64_t SERIAL_EXPORT Open(char* port);
    void SERIAL_EXPORT Close(uint64_t handle);
    void SERIAL_EXPORT Poll(uint64_t handle);
    void SERIAL_EXPORT SendSyncAck(uint64_t handle);
    void SERIAL_EXPORT SendHeartbeatAck(uint64_t handle);
    void SERIAL_EXPORT SendMotor(uint64_t handle, uint8_t controlMethod, uint8_t pantoIndex, float positionX, float positionY, float rotation);
    void SERIAL_EXPORT CreateObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    void SERIAL_EXPORT AddToObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y);
    void SERIAL_EXPORT RemoveObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId);
    void SERIAL_EXPORT EnableObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId);
    void SERIAL_EXPORT DisableObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId);
};
