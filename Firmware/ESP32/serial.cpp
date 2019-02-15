#include "serial.hpp"
#include "panto.hpp"

DPSerial::Header DPSerial::s_header = DPSerial::Header();
uint8_t DPSerial::s_debugLogBuffer[c_debugLogBufferSize];
portMUX_TYPE DPSerial::s_serialMutex = {portMUX_FREE_VAL, 0};
DPSerial::ReceiveState DPSerial::s_receiveState = NONE;
bool DPSerial::s_connected = false;
unsigned long DPSerial::s_lastHeartbeatTime = 0;
int DPSerial::s_unacknowledgedHeartbeats = 0;

// === private ===

// send helper

void DPSerial::sendUInt8(uint8_t data)
{
    Serial.write(data);
}

void DPSerial::sendInt32(int32_t data)
{
    Serial.write(static_cast<uint8_t>(data >> 24));
    Serial.write(static_cast<uint8_t>((data >> 16) & 255));
    Serial.write(static_cast<uint8_t>((data >> 8) & 255));
    Serial.write(static_cast<uint8_t>(data & 255));
}

void DPSerial::sendUInt32(uint32_t data)
{
    sendInt32(*reinterpret_cast<int32_t*>(&data));
}

void DPSerial::sendFloat(float data)
{
    sendInt32(*reinterpret_cast<int32_t*>(&data));
}

void DPSerial::sendMessageType(DPSerial::MessageType data)
{
    Serial.write(data);
}

void DPSerial::sendMagicNumber()
{
    for(auto i = 0; i < c_magicNumberSize; ++i)
    {
        sendUInt8(c_magicNumber[i]);
    }
};

void DPSerial::sendHeader(MessageType messageType, uint32_t payloadSize)
{
    sendMessageType(messageType);
    sendUInt32(payloadSize);
};

// send

void DPSerial::sendSync()
{
    portENTER_CRITICAL(&s_serialMutex);
    sendMagicNumber();
    sendHeader(SYNC, 4);
    sendUInt32(c_revision);
    portEXIT_CRITICAL(&s_serialMutex);
};

void DPSerial::sendHeartbeat()
{
    portENTER_CRITICAL(&s_serialMutex);
    sendMagicNumber();
    sendHeader(HEARTBEAT, 0);
    s_unacknowledgedHeartbeats++;
    portEXIT_CRITICAL(&s_serialMutex);
};

// receive helper

uint8_t DPSerial::receiveUInt8()
{
    return static_cast<uint8_t>(Serial.read());
}

int32_t DPSerial::receiveInt32()
{
    return Serial.read() << 24 | Serial.read() << 16 | Serial.read() << 8 | Serial.read();
}

uint32_t DPSerial::receiveUInt32()
{
    auto temp = receiveInt32();
    return *reinterpret_cast<uint32_t*>(&temp);
}

float DPSerial::receiveFloat()
{
    auto temp = receiveInt32();
    return *reinterpret_cast<float*>(&temp);
}

DPSerial::MessageType DPSerial::receiveMessageType()
{
    return static_cast<MessageType>(Serial.read());
}

bool DPSerial::receiveMagicNumber()
{
    int magicNumberProgress = 0;

    // as long as enough data is available to find the magic number
    while(Serial.available() >= c_magicNumberSize)
    {
        // does next byte fit expected by of magic number?
        if(Serial.read() == c_magicNumber[magicNumberProgress])
        {
            // yes - increase index. If check complete, return true.
            if(++magicNumberProgress == c_magicNumberSize)
            {
                s_receiveState = FOUND_MAGIC;
                return true;
            }
        }
        else
        {
            // no - reset search progress
            magicNumberProgress = 0;
        }
    }

    // ran out of available data before finding complete number - return false
    return false;
};

bool DPSerial::receiveHeader()
{
    // make sure enough data is available
    if(Serial.available() < c_headerSize)
    {
        return false;
    }

    s_header.MessageType = receiveUInt8();
    s_header.PayloadSize = receiveUInt32();
    s_receiveState = FOUND_HEADER;
    return true;
};

bool DPSerial::payloadReady()
{
    return Serial.available() >= s_header.PayloadSize;
};

// receive

void DPSerial::receiveSyncAck()
{
    sendDebugLog("receiveSyncAck");

    s_connected = true;
};

void DPSerial::receiveHearbeatAck()
{
    sendDebugLog("receiveHearbeatAck");

    s_unacknowledgedHeartbeats = 0;
};

void DPSerial::receiveMotor()
{
    auto controlMethod = receiveUInt8();
    auto pantoIndex = receiveUInt8();

    //sendDebugLog("receiveMotor - index %i", pantoIndex);

    pantos[pantoIndex].isforceRendering = (controlMethod == 1);
    pantos[pantoIndex].target = Vector2D(receiveFloat(), receiveFloat());
    pantos[pantoIndex].targetAngle[2] = receiveFloat();
    pantos[pantoIndex].inverseKinematics();
};

void DPSerial::receivePID()
{
    sendDebugLog("receivePID");

    auto motorIndex = receiveUInt8();

    for(auto i = 0; i < 3; ++i)
    {
        pidFactor[motorIndex][i] = receiveFloat();
    }
};

void DPSerial::receiveInvalid()
{
    // TODO
    sendDebugLog("receiveInvalid");
};

// === public ===

// setup

bool DPSerial::ensureConnection()
{
    if(!s_connected)
    {
        sendSync();
        return false;
    }

    if(s_unacknowledgedHeartbeats > c_maxUnacklowledgedHeartbeats)
    {
        sendDebugLog("Disconnected due to too many unacklowledged heartbeats.");
        s_unacknowledgedHeartbeats = 0;
        s_connected = false;
        return false;
    }

    if(millis() > s_lastHeartbeatTime + c_heartbeatIntervalMs || s_lastHeartbeatTime == 0)
    {
        sendHeartbeat();
        s_lastHeartbeatTime = millis();
    }

    return true;
}

// send

void DPSerial::sendPosition()
{
    portENTER_CRITICAL(&s_serialMutex);
    sendMagicNumber();
    sendHeader(POSITION, pantoCount * 3 * 4); // three values per panto, 4 bytes each
    
    for(auto i = 0; i < pantoCount; ++i)
    {
        sendFloat(pantos[i].handle.x);
        sendFloat(pantos[i].handle.y);
        sendFloat(pantos[i].pointingAngle);
    }
    portEXIT_CRITICAL(&s_serialMutex);
};

void DPSerial::sendDebugLog(const char* message, ...)
{
    portENTER_CRITICAL(&s_serialMutex);
    sendMagicNumber();
    va_list args;
    va_start(args, message);
    uint8_t length = vsnprintf(reinterpret_cast<char*>(s_debugLogBuffer), c_debugLogBufferSize, message, args);
    va_end(args);
    sendHeader(DEBUG_LOG, length);
    Serial.write(s_debugLogBuffer, length);
    portEXIT_CRITICAL(&s_serialMutex);
};

// receive

void DPSerial::receive()
{
    if(s_receiveState == NONE && !receiveMagicNumber())
    {
        return;
    }

    if(s_receiveState == FOUND_MAGIC && !receiveHeader())
    {
        return;
    }

    if(s_receiveState == FOUND_HEADER && !payloadReady())
    {
        return;
    }
    
    if(!s_connected && s_header.MessageType != SYNC_ACK)
    {
        for(auto i = 0; i < s_header.PayloadSize; ++i)
        {
            Serial.read();
        }
        return;
    }

    switch (s_header.MessageType)
    {
        case SYNC_ACK:
            receiveSyncAck();
            break;
        case HEARTBEAT_ACK:
            receiveHearbeatAck();
            break;
        case MOTOR:
            receiveMotor();
            break;
        case PID:
            receivePID();
            break;
        default:
            receiveInvalid();
            break;
    }

    s_receiveState = NONE;
};