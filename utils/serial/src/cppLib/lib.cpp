#include "libInterface.hpp"

#include <iostream>

// class stuff

uint32_t CppLib::getRevision()
{
    return c_revision;
}

uint64_t CppLib::open(char* port)
{
    if(!setup(port))
    {
        log("Open failed");
        return 0;
    }
    log("Open successfull");
    return (uint64_t) s_handle;
}

void CppLib::setActiveHandle(uint64_t handle)
{
    s_handle = (void*) handle;
}

void CppLib::close()
{
    tearDown();
}

void CppLib::poll()
{
    bool receivedSync = false;
    bool receivedHeartbeat = false;
    bool receivedPosition = false;
    double positionCoords[2 * 5];

    while (getAvailableByteCount(s_handle))
    {
        receivePacket();

        if (s_header.PayloadSize > c_maxPayloadSize)
        {
            continue;
        }

        uint16_t offset = 0;
        switch (s_header.MessageType)
        {
        case SYNC:
        {
            auto receivedRevision = DPSerial::receiveUInt32(offset);
            if (receivedRevision == c_revision)
            {
                receivedSync = true;
            }
            else
            {
                log("Revision id not matching");
            }
            break;
        }
        case HEARTBEAT:
            receivedHeartbeat = true;
            break;
        case POSITION:
            receivedPosition = true;
            while (offset < s_header.PayloadSize)
            {
                uint8_t index = offset / 4;
                positionCoords[index] = DPSerial::receiveFloat(offset);
            }
            break;
        case DEBUG_LOG:
            log((char*)s_packetBuffer);
            break;
        default:
            break;
        }
    }

    if(receivedSync)
    {
        if(syncHandler == nullptr)
        {
            log("Received sync, but handler not set up");
        }
        else
        {
            syncHandler((uint64_t)s_handle);
        }
    }

    if(receivedHeartbeat)
    {
        if(heartbeatHandler == nullptr)
        {
            log("Received heartbeat, but handler not set up");
        }
        else
        {
            heartbeatHandler((uint64_t)s_handle);
        }
    }

    if (receivedPosition)
    {
        if(positionHandler == nullptr)
        {
            log("Received position, but handler not set up");
        }
        else
        {
            positionHandler((uint64_t)s_handle, positionCoords);
        }
    }
}

void CppLib::sendSyncAck ()
{
    s_header.MessageType = SYNC_ACK;
    s_header.PayloadSize = 0;
    sendPacket();
}

void CppLib::sendHeartbeatAck ()
{
    s_header.MessageType = HEARTBEAT_ACK;
    s_header.PayloadSize = 0;
    sendPacket();
}

void CppLib::sendMotor (uint8_t controlMethod, uint8_t pantoIndex, float positionX, float positionY, float rotation)
{
    s_header.MessageType = MOTOR;
    s_header.PayloadSize = 14; // 1 for control, 1 for index, 3 * 4 for position
    uint16_t offset = 0;
    sendUInt8(controlMethod, offset);
    sendUInt8(pantoIndex, offset);
    sendFloat(positionX, offset);
    sendFloat(positionY, offset);
    sendFloat(rotation, offset);
    sendPacket();
}

void CppLib::createObstacle (uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y)
{
    s_header.MessageType = CREATE_OBSTACLE;
    s_header.PayloadSize = 19; // 1 for index, 2 for id, 2 * 2 * 4 for vectors
    uint16_t offset = 0;
    sendUInt8(pantoIndex, offset);
    sendUInt16(obstacleId, offset);
    sendFloat(vector1x, offset);
    sendFloat(vector1y, offset);
    sendFloat(vector2x, offset);
    sendFloat(vector2y, offset);
    sendPacket();
    dumpBuffersToFile();
}

void CppLib::addToObstacle(uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y)
{
    s_header.MessageType = ADD_TO_OBSTACLE;
    s_header.PayloadSize = 19; // 1 for index, 2 for id, 2 * 2 * 4 for vectors
    uint16_t offset = 0;
    sendUInt8(pantoIndex, offset);
    sendUInt16(obstacleId, offset);
    sendFloat(vector1x, offset);
    sendFloat(vector1y, offset);
    sendFloat(vector2x, offset);
    sendFloat(vector2y, offset);
    sendPacket();
}

void CppLib::removeObstacle(uint8_t pantoIndex, uint16_t obstacleId)
{
    s_header.MessageType = REMOVE_OBSTACLE;
    s_header.PayloadSize = 3; // 1 for index, 2 for id
    uint16_t offset = 0;
    sendUInt8(pantoIndex, offset);
    sendUInt16(obstacleId, offset);
    sendPacket();
}

void CppLib::enableObstacle(uint8_t pantoIndex, uint16_t obstacleId)
{
    s_header.MessageType = ENABLE_OBSTACLE;
    s_header.PayloadSize = 3; // 1 for index, 2 for id
    uint16_t offset = 0;
    sendUInt8(pantoIndex, offset);
    sendUInt16(obstacleId, offset);
    sendPacket();
}

void CppLib::disableObstacle(uint8_t pantoIndex, uint16_t obstacleId)
{
    s_header.MessageType = DISABLE_OBSTACLE;
    s_header.PayloadSize = 3; // 1 for index, 2 for id
    uint16_t offset = 0;
    sendUInt8(pantoIndex, offset);
    sendUInt16(obstacleId, offset);
    sendPacket();
}

// handlers
syncHandler_t syncHandler;
heartbeatHandler_t heartbeatHandler;
positionHandler_t positionHandler;
loggingHandler_t loggingHandler;

void log (char* msg)
{
    if(loggingHandler != nullptr)
    {
        loggingHandler(msg);
    }
}

// can't export any member functions, not even static ones
// thus we'll have to add wrappers for everything

uint32_t GetRevision()
{
    return CppLib::getRevision();
}

void SERIAL_EXPORT SetSyncHandler(syncHandler_t handler)
{
    syncHandler = handler;
    log("Sync handler set");
}

void SERIAL_EXPORT SetHeartbeatHandler(heartbeatHandler_t handler)
{
    heartbeatHandler = handler;
    log("Heartbeat handler set");
}

void SERIAL_EXPORT SetPositionHandler(positionHandler_t handler)
{
    positionHandler = handler;
    log("Position handler set");
}

void SERIAL_EXPORT SetLoggingHandler(loggingHandler_t handler)
{
    loggingHandler = handler;
    loggingHandler("Logging from plugin is enabled");
}

uint64_t SERIAL_EXPORT Open(char* port)
{
    return CppLib::open(port);
}

void SERIAL_EXPORT Close(uint64_t handle)
{
    CppLib::setActiveHandle(handle);
    CppLib::close();
}

void SERIAL_EXPORT Poll(uint64_t handle)
{
    CppLib::setActiveHandle(handle);
    CppLib::poll();
}

void SERIAL_EXPORT SendSyncAck(uint64_t handle)
{
    CppLib::setActiveHandle(handle);
    CppLib::sendSyncAck();
}

void SERIAL_EXPORT SendHeartbeatAck(uint64_t handle)
{
    CppLib::setActiveHandle(handle);
    CppLib::sendHeartbeatAck();
}

void SERIAL_EXPORT SendMotor(uint64_t handle, uint8_t controlMethod, uint8_t pantoIndex, float positionX, float positionY, float rotation)
{
    CppLib::setActiveHandle(handle);
    CppLib::sendMotor(controlMethod, pantoIndex, positionX, positionY, rotation);
}

void SERIAL_EXPORT CreateObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y)
{
    CppLib::setActiveHandle(handle);
    CppLib::createObstacle(pantoIndex, obstacleId, vector1x, vector1y, vector2x, vector2y);
}

void SERIAL_EXPORT AddToObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y)
{
    CppLib::setActiveHandle(handle);
    CppLib::addToObstacle(pantoIndex, obstacleId, vector1x, vector1y, vector2x, vector2y);
}

void SERIAL_EXPORT RemoveObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId)
{
    CppLib::setActiveHandle(handle);
    CppLib::removeObstacle(pantoIndex, obstacleId);
}

void SERIAL_EXPORT EnableObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId)
{
    CppLib::setActiveHandle(handle);
    CppLib::enableObstacle(pantoIndex, obstacleId);
}

void SERIAL_EXPORT DisableObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId)
{
    CppLib::setActiveHandle(handle);
    CppLib::disableObstacle(pantoIndex, obstacleId);
}