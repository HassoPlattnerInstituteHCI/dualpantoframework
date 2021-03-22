#include "libInterface.hpp"

#include <iostream>
#include <sstream>

#include "packet.hpp"

#ifdef _WIN32
#define FILEPTR void *
#else
#define FILEPTR FILE *
#endif

// class stuff

uint32_t CppLib::getRevision()
{
    return c_revision;
}

uint64_t CppLib::open(char *port)
{
    if (!setup(port))
    {
        logString("Open failed");
        return 0;
    }
    logString("Open successfull");
    return (uint64_t)s_handle;
}

void CppLib::setActiveHandle(uint64_t handle)
{
    s_handle = (FILEPTR)handle;
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
    bool receivedTransition = false;
    double positionCoords[2 * 5];
    uint8_t pantoIndex;

    while (s_receiveQueue.size() > 0)
    {
        auto packet = s_receiveQueue.front();
        s_receiveQueue.pop();

        if (packet.header.PayloadSize > c_maxPayloadSize)
        {
            continue;
        }

        switch (packet.header.MessageType)
        {
        case SYNC:
        {
            auto receivedRevision = packet.receiveUInt32();
            if (receivedRevision == c_revision)
            {
                receivedSync = true;
            }
            else
            {
                std::ostringstream oss;
                oss << "Revision id not matching. Expected " << c_revision
                    << ", received " << receivedRevision << "." << std::endl;
                logString((char *)oss.str().c_str());
            }
            break;
        }
        case HEARTBEAT:
            receivedHeartbeat = true;
            break;
        case POSITION:
            receivedPosition = true;
            while (packet.payloadIndex < packet.header.PayloadSize)
            {
                uint8_t index = packet.payloadIndex / 4;
                positionCoords[index] = packet.receiveFloat();
            }
            break;
        case DEBUG_LOG:
            logString((char *)packet.payload);
            break;
        case TRANSITION_ENDED:
            receivedTransition = true;
            pantoIndex = packet.receiveUInt8();
            break;
        default:
            break;
        }
    }

    if (receivedSync)
    {
        if (syncHandler == nullptr)
        {
            logString("Received sync, but handler not set up");
        }
        else
        {
            syncHandler((uint64_t)s_handle);
        }
    }

    if (receivedHeartbeat)
    {
        if (heartbeatHandler == nullptr)
        {
            logString("Received heartbeat, but handler not set up");
        }
        else
        {
            heartbeatHandler((uint64_t)s_handle);
        }
    }

    if (receivedPosition)
    {
        if (positionHandler == nullptr)
        {
            logString("Received position, but handler not set up");
        }
        else
        {
            positionHandler((uint64_t)s_handle, positionCoords);
        }
    }

    if (receivedTransition)
    {
        // transition (tweening) ended
        if (transitionHandler == nullptr)
        {
            logString("Received transition ended, but handler not set up");
        }
        else
        {
            transitionHandler(pantoIndex);
        }
    }
}

void CppLib::sendSyncAck()
{
    DPSerial::sendInstantPacket(Packet(SYNC_ACK, 0));
}

void CppLib::sendHeartbeatAck()
{
    DPSerial::sendInstantPacket(Packet(HEARTBEAT_ACK, 0));
}

void CppLib::sendMotor(uint8_t controlMethod, uint8_t pantoIndex, float positionX, float positionY, float rotation)
{
    auto p = Packet(MOTOR, 14); // 1 for control, 1 for index, 3 * 4 for pos
    p.sendUInt8(controlMethod);
    p.sendUInt8(pantoIndex);
    p.sendFloat(positionX);
    p.sendFloat(positionY);
    p.sendFloat(rotation);
    sendPacket(p);
}

void CppLib::sendSpeed(uint8_t pantoIndex, float speed)
{
    auto p = Packet(SPEED, 5); // 1 for index, 1 * 4 for position
    p.sendUInt8(pantoIndex);
    p.sendFloat(speed);
    sendPacket(p);
}

void CppLib::sendFree(uint8_t pantoIndex)
{
    auto p = Packet(FREE, 1);
    p.sendUInt8(pantoIndex);
    sendPacket(p);
}

void CppLib::sendFreeze(uint8_t pantoIndex)
{
    auto p = Packet(FREEZE, 1);
    p.sendUInt8(pantoIndex);
    sendPacket(p);
}

void CppLib::sendSpeedControl(uint8_t tethered, float tetherFactor, float tetherInnerRadius, float tetherOuterRadius, uint8_t strategy, uint8_t pockEnabled)
{
    auto p = Packet(SPEED_CONTROL, 15); // 1 for index, 4 for tether factor, 4 each for the tether radii, 1 for tether strategy and 1 for pock
    p.sendUInt8(tethered);
    p.sendFloat(tetherFactor);
    p.sendFloat(tetherInnerRadius);
    p.sendFloat(tetherOuterRadius);
    p.sendUInt8(strategy);
    p.sendUInt8(pockEnabled);
    sendPacket(p);
}

void CppLib::createObstacle(uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y)
{
    auto p = Packet(CREATE_OBSTACLE, 19); // 1 for index, 2 for id, 2 * 2 * 4 for vectors
    p.sendUInt8(pantoIndex);
    p.sendUInt16(obstacleId);
    p.sendFloat(vector1x);
    p.sendFloat(vector1y);
    p.sendFloat(vector2x);
    p.sendFloat(vector2y);
    sendPacket(p);
}

void CppLib::createPassableObstacle(uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y)
{
    auto p = Packet(CREATE_PASSABLE_OBSTACLE, 19); // 1 for index, 2 for id, 2 * 2 * 4 for vectors
    p.sendUInt16(obstacleId);
    p.sendFloat(vector1x);
    p.sendFloat(vector1y);
    p.sendFloat(vector2x);
    p.sendFloat(vector2y);
    sendPacket(p);
}

void CppLib::createRail(uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y, float displacement)
{
    auto p = Packet(CREATE_RAIL, 23); // 1 for index, 2 for id, 2 * 2 * 4 for vectors, 4 for displacement
    p.sendUInt8(pantoIndex);
    p.sendUInt16(obstacleId);
    p.sendFloat(vector1x);
    p.sendFloat(vector1y);
    p.sendFloat(vector2x);
    p.sendFloat(vector2y);
    p.sendFloat(displacement);
    sendPacket(p);
}

void CppLib::addToObstacle(uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y)
{
    auto p = Packet(ADD_TO_OBSTACLE, 19); // 1 for index, 2 for id, 2 * 2 * 4 for vectors
    p.sendUInt8(pantoIndex);
    p.sendUInt16(obstacleId);
    p.sendFloat(vector1x);
    p.sendFloat(vector1y);
    p.sendFloat(vector2x);
    p.sendFloat(vector2y);
    sendPacket(p);
}

void CppLib::removeObstacle(uint8_t pantoIndex, uint16_t obstacleId)
{
    auto p = Packet(REMOVE_OBSTACLE, 3); // 1 for index, 2 for id
    p.sendUInt8(pantoIndex);
    p.sendUInt16(obstacleId);
    sendPacket(p);
}

void CppLib::enableObstacle(uint8_t pantoIndex, uint16_t obstacleId)
{
    auto p = Packet(ENABLE_OBSTACLE, 3); // 1 for index, 2 for id
    p.sendUInt8(pantoIndex);
    p.sendUInt16(obstacleId);
    sendPacket(p);
}

void CppLib::disableObstacle(uint8_t pantoIndex, uint16_t obstacleId)
{
    auto p = Packet(DISABLE_OBSTACLE, 3); // 1 for index, 2 for id
    p.sendUInt8(pantoIndex);
    p.sendUInt16(obstacleId);
    sendPacket(p);
}

void CppLib::reset()
{
    DPSerial::reset();
}

// handlers
syncHandler_t syncHandler;
heartbeatHandler_t heartbeatHandler;
positionHandler_t positionHandler;
loggingHandler_t loggingHandler;
transitionHandler_t transitionHandler;

void logString(char *msg)
{
    if (loggingHandler != nullptr)
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
    logString("Sync handler set");
}

void SERIAL_EXPORT SetHeartbeatHandler(heartbeatHandler_t handler)
{
    heartbeatHandler = handler;
    logString("Heartbeat handler set");
}

void SERIAL_EXPORT SetPositionHandler(positionHandler_t handler)
{
    positionHandler = handler;
    logString("Position handler set");
}

void SERIAL_EXPORT SetLoggingHandler(loggingHandler_t handler)
{
    loggingHandler = handler;
    loggingHandler("Logging from plugin is enabled");
}

void SERIAL_EXPORT SetTransitionHandler(transitionHandler_t handler)
{
    transitionHandler = handler;
    logString("Transition handler set");
}

uint64_t SERIAL_EXPORT Open(char *port)
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

void SERIAL_EXPORT SendSpeed(uint64_t handle, uint8_t pantoIndex, float speed)
{
    CppLib::setActiveHandle(handle);
    CppLib::sendSpeed(pantoIndex, speed);
}

void SERIAL_EXPORT FreeMotor(uint64_t handle, uint8_t pantoIndex)
{
    CppLib::setActiveHandle(handle);
    CppLib::sendFree(pantoIndex);
}

void SERIAL_EXPORT FreezeMotor(uint64_t handle, uint8_t pantoIndex)
{
    CppLib::setActiveHandle(handle);
    CppLib::sendFreeze(pantoIndex);
}

void SERIAL_EXPORT CreateObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y)
{
    CppLib::setActiveHandle(handle);
    CppLib::createObstacle(pantoIndex, obstacleId, vector1x, vector1y, vector2x, vector2y);
}

void SERIAL_EXPORT CreatePassableObstacle(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y)
{
    CppLib::setActiveHandle(handle);
    CppLib::createPassableObstacle(pantoIndex, obstacleId, vector1x, vector1y, vector2x, vector2y);
}

void SERIAL_EXPORT CreateRail(uint64_t handle, uint8_t pantoIndex, uint16_t obstacleId, float vector1x, float vector1y, float vector2x, float vector2y, float displacement)
{
    CppLib::setActiveHandle(handle);
    CppLib::createRail(pantoIndex, obstacleId, vector1x, vector1y, vector2x, vector2y, displacement);
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

void SERIAL_EXPORT SetSpeedControl(uint64_t handle, uint8_t tethered, float tetherFactor, float tetherInnerRadius, float tetherOuterRadius, uint8_t strategy, uint8_t pockEnabled)
{
    CppLib::sendSpeedControl(tethered, tetherFactor, tetherInnerRadius, tetherOuterRadius, strategy, pockEnabled);
}

uint32_t SERIAL_EXPORT CheckQueuedPackets(uint32_t maxPackets)
{
    return 0;
}

void SERIAL_EXPORT Reset()
{
    CppLib::reset();
}