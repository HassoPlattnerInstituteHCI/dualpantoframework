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
