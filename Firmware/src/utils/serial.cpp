#include "utils/serial.hpp"

#include <vector>

#include "hardware/panto.hpp"
#include "physics/pantoPhysics.hpp"
#include "utils/vector.hpp"

DPSerial::Header DPSerial::s_header = DPSerial::Header();
uint8_t DPSerial::s_debugLogBuffer[c_debugLogBufferSize];
std::queue<std::string> DPSerial::s_debugLogQueue;
portMUX_TYPE DPSerial::s_serialMutex = {portMUX_FREE_VAL, 0};
DPSerial::ReceiveState DPSerial::s_receiveState = NONE;
bool DPSerial::s_connected = false;
unsigned long DPSerial::s_lastHeartbeatTime = 0;
int DPSerial::s_unacknowledgedHeartbeats = 0;
std::map<DPProtocol::MessageType, std::function<void()>> 
    DPSerial::s_receiveHandlers = {
        {SYNC_ACK, DPSerial::receiveSyncAck},
        {HEARTBEAT_ACK, DPSerial::receiveHearbeatAck},
        {MOTOR, DPSerial::receiveMotor},
        {PID, DPSerial::receivePID},
        {CREATE_OBSTACLE, DPSerial::receiveCreateObstacle},
        {ADD_TO_OBSTACLE, DPSerial::receiveAddToObstacle},
        {REMOVE_OBSTACLE, DPSerial::receiveRemoveObstacle},
        {ENABLE_OBSTACLE, DPSerial::receiveEnableObstacle},
        {DISABLE_OBSTACLE, DPSerial::receiveDisableObstacle},
        {DUMP_HASHTABLE, DPSerial::receiveDumpHashtable}
    };

// === private ===

// send helper

void DPSerial::sendUInt8(uint8_t data)
{
    Serial.write(data);
}

void DPSerial::sendInt16(int16_t data)
{
    Serial.write(static_cast<uint8_t>(data >> 8));
    Serial.write(static_cast<uint8_t>(data & 255));
}

void DPSerial::sendUInt16(uint16_t data)
{
    sendInt16(reinterpret_cast<int16_t &>(data));
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
    sendInt32(reinterpret_cast<int32_t &>(data));
}

void DPSerial::sendFloat(float data)
{
    #pragma GCC diagnostic push
    #pragma GCC diagnostic ignored "-Wstrict-aliasing"
    sendInt32(reinterpret_cast<int32_t &>(data));
    #pragma GCC diagnostic pop
}

void DPSerial::sendMessageType(DPSerial::MessageType data)
{
    Serial.write(data);
}

void DPSerial::sendMagicNumber()
{
    for (auto i = 0; i < c_magicNumberSize; ++i)
    {
        sendUInt8(c_magicNumber[i]);
    }
};

void DPSerial::sendHeader(MessageType messageType, uint16_t payloadSize)
{
    sendMessageType(messageType);
    sendUInt16(payloadSize);
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

int16_t DPSerial::receiveInt16()
{
    return Serial.read() << 8 | Serial.read();
}

uint16_t DPSerial::receiveUInt16()
{
    auto temp = receiveInt16();
    return reinterpret_cast<uint16_t &>(temp);
}

int32_t DPSerial::receiveInt32()
{
    return Serial.read() << 24 | Serial.read() << 16 | Serial.read() << 8 | Serial.read();
}

uint32_t DPSerial::receiveUInt32()
{
    auto temp = receiveInt32();
    return reinterpret_cast<uint32_t &>(temp);
}

float DPSerial::receiveFloat()
{
    auto temp = receiveInt32();
    #pragma GCC diagnostic push
    #pragma GCC diagnostic ignored "-Wstrict-aliasing"
    return reinterpret_cast<float &>(temp);
    #pragma GCC diagnostic pop
}

DPSerial::MessageType DPSerial::receiveMessageType()
{
    return static_cast<MessageType>(Serial.read());
}

bool DPSerial::receiveMagicNumber()
{
    int magicNumberProgress = 0;

    // as long as enough data is available to find the magic number
    while (Serial.available() >= c_magicNumberSize)
    {
        // does next byte fit expected by of magic number?
        if (Serial.read() == c_magicNumber[magicNumberProgress])
        {
            // yes - increase index. If check complete, return true.
            if (++magicNumberProgress == c_magicNumberSize)
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
    if (Serial.available() < c_headerSize)
    {
        return false;
    }

    s_header.MessageType = receiveUInt8();
    s_header.PayloadSize = receiveUInt16();
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
    s_connected = true;
};

void DPSerial::receiveHearbeatAck()
{
    s_unacknowledgedHeartbeats = 0;
};

void DPSerial::receiveMotor()
{
    const auto controlMethod = receiveUInt8();
    const auto pantoIndex = receiveUInt8();

    const auto target = Vector2D(receiveFloat(), receiveFloat());
    pantos[pantoIndex].setRotation(receiveFloat());
    pantos[pantoIndex].setTarget(target, controlMethod == 1);
};

void DPSerial::receivePID()
{
    auto motorIndex = receiveUInt8();

    for (auto i = 0; i < 3; ++i)
    {
        pidFactor[motorIndex][i] = receiveFloat();
    }
};

void DPSerial::receiveCreateObstacle()
{
    auto pantoIndex = receiveUInt8();
    auto id = receiveUInt16();

    auto vecCount = (s_header.PayloadSize - 1 - 2) / (4 * 2);

    std::vector<Vector2D> path;
    path.reserve(vecCount);

    for(auto i = 0; i < vecCount; ++i)
    {
        path.emplace_back((double)receiveFloat(), (double)receiveFloat());
    }

    for(auto i = 0; i < pantoPhysics.size(); ++i)
    {
        if(pantoIndex == 0xFF || i == pantoIndex)
        {
            pantoPhysics[i].godObject()->createObstacle(id, path);
        }
    }
}

void DPSerial::receiveAddToObstacle()
{
    auto pantoIndex = receiveUInt8();
    auto id = receiveUInt16();

    auto vecCount = (s_header.PayloadSize - 1 - 2) / (4 * 2);

    std::vector<Vector2D> path;
    path.reserve(vecCount);

    for(auto i = 0; i < vecCount; ++i)
    {
        path.emplace_back((double)receiveFloat(), (double)receiveFloat());
    }

    for(auto i = 0; i < pantoPhysics.size(); ++i)
    {
        if(pantoIndex == 0xFF || i == pantoIndex)
        {
            pantoPhysics[i].godObject()->addToObstacle(id, path);
        }
    }
}

void DPSerial::receiveRemoveObstacle()
{
    auto pantoIndex = receiveUInt8();
    auto id = receiveUInt16();

    for(auto i = 0; i < pantoPhysics.size(); ++i)
    {
        if(pantoIndex == 0xFF || i == pantoIndex)
        {
            pantoPhysics[i].godObject()->removeObstacle(id);
        }
    }
}

void DPSerial::receiveEnableObstacle()
{
    auto pantoIndex = receiveUInt8();
    auto id = receiveUInt16();

    for(auto i = 0; i < pantoPhysics.size(); ++i)
    {
        if(pantoIndex == 0xFF || i == pantoIndex)
        {
            pantoPhysics[i].godObject()->enableObstacle(id);
        }
    }
}

void DPSerial::receiveDisableObstacle()
{
    auto pantoIndex = receiveUInt8();
    auto id = receiveUInt16();

    for(auto i = 0; i < pantoPhysics.size(); ++i)
    {
        if(pantoIndex == 0xFF || i == pantoIndex)
        {
            pantoPhysics[i].godObject()->enableObstacle(id, false);
        }
    }
}

void DPSerial::receiveDumpHashtable()
{
    auto pantoIndex = receiveUInt8();
    for(auto i = 0; i < pantoPhysics.size(); ++i)
    {
        if(pantoIndex == 0xFF || i == pantoIndex)
        {
            pantoPhysics[i].godObject()->dumpHashtable();
        }
    }
}

void DPSerial::receiveInvalid()
{
    sendQueuedDebugLog("Received invalid message: %02X", s_header.MessageType);
};

// === public ===

// setup

void DPSerial::init()
{
    Serial.begin(c_baudRate); 
    Serial.setRxBufferSize(4 * c_maxPayloadSize);
}

bool DPSerial::ensureConnection()
{
    if (!s_connected)
    {
        sendSync();
        return false;
    }

    if (s_unacknowledgedHeartbeats > c_maxUnacklowledgedHeartbeats)
    {
        sendQueuedDebugLog("Disconnected due to too many unacklowledged heartbeats.");
        s_unacknowledgedHeartbeats = 0;
        s_connected = false;
        return false;
    }

    if (millis() > s_lastHeartbeatTime + c_heartbeatIntervalMs || s_lastHeartbeatTime == 0)
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
    sendHeader(POSITION, pantoCount * 5 * 4); // five values per panto, 4 bytes each

    for(auto i = 0; i < pantoCount; ++i)
    {
        const auto panto = pantos[i];
        const auto pos = panto.getPosition();
        sendFloat(pos.x);
        sendFloat(pos.y);
        sendFloat(panto.getRotation());
        auto goPos = pantoPhysics[i].godObject()->getPosition();
        sendFloat(goPos.x);
        sendFloat(goPos.y);
    }
    portEXIT_CRITICAL(&s_serialMutex);
};

void DPSerial::sendInstantDebugLog(const char *message, ...)
{
    portENTER_CRITICAL(&s_serialMutex);
    va_list args;
    va_start(args, message);
    uint16_t length = vsnprintf(reinterpret_cast<char *>(s_debugLogBuffer), c_debugLogBufferSize, message, args);
    va_end(args);
    length = constrain(length, 0, c_debugLogBufferSize);
    sendMagicNumber();
    sendHeader(DEBUG_LOG, length);
    Serial.write(s_debugLogBuffer, length);
    portEXIT_CRITICAL(&s_serialMutex);
};

void DPSerial::sendQueuedDebugLog(const char *message, ...)
{
    portENTER_CRITICAL(&s_serialMutex);
    va_list args;
    va_start(args, message);
    uint16_t length = vsnprintf(reinterpret_cast<char *>(s_debugLogBuffer), c_debugLogBufferSize, message, args);
    va_end(args);
    length = constrain(length, 0, c_debugLogBufferSize);
    s_debugLogQueue.emplace(reinterpret_cast<char *>(s_debugLogBuffer), length);
    portEXIT_CRITICAL(&s_serialMutex);
};

void DPSerial::processDebugLogQueue()
{
    portENTER_CRITICAL(&s_serialMutex);
    // quick check to avoid loop if not necessary
    if(!s_debugLogQueue.empty())
    {
        for(auto i = 0; i < c_processedQueuedMessagesPerFrame; ++i)
        {
            if(!s_debugLogQueue.empty())
            {
                auto& msg = s_debugLogQueue.front();
                auto length = msg.length();
                sendMagicNumber();
                sendHeader(DEBUG_LOG, length);
                Serial.write(
                    reinterpret_cast<const uint8_t *>(msg.c_str()),
                    length);
                s_debugLogQueue.pop();
            }
        }
    }
    portEXIT_CRITICAL(&s_serialMutex);
}

void DPSerial::sendDebugData()
{
    const auto pos0 = pantos[0].getPosition();
    const auto pos1 = pantos[1].getPosition();
    portENTER_CRITICAL(&s_serialMutex);
    sendInstantDebugLog("[ang/0] %+08.3f | %+08.3f | %+08.3f [ang/1] %+08.3f | %+08.3f | %+08.3f [pos/0] %+08.3f | %+08.3f | %+08.3f [pos/1] %+08.3f | %+08.3f | %+08.3f",
        degrees(pantos[0].getActuationAngle(0)),
        degrees(pantos[0].getActuationAngle(1)), 
        degrees(pantos[0].getActuationAngle(2)), 
        degrees(pantos[1].getActuationAngle(0)), 
        degrees(pantos[1].getActuationAngle(1)), 
        degrees(pantos[1].getActuationAngle(2)),
        pos0.x,
        pos0.y,
        degrees(pantos[0].getRotation()),
        pos1.x,
        pos1.y,
        degrees(pantos[1].getRotation()));
    portEXIT_CRITICAL(&s_serialMutex);
};

// receive

void DPSerial::receive()
{
    if (s_receiveState == NONE && !receiveMagicNumber())
    {
        return;
    }

    if (s_receiveState == FOUND_MAGIC && !receiveHeader())
    {
        return;
    }

    if (s_receiveState == FOUND_HEADER && !payloadReady())
    {
        if(s_header.MessageType == ADD_TO_OBSTACLE)
            sendQueuedDebugLog("Only %i of %i bytes available", Serial.available(), s_header.PayloadSize);
        return;
    }

    if (!s_connected && s_header.MessageType != SYNC_ACK)
    {
        for (auto i = 0; i < s_header.PayloadSize; ++i)
        {
            Serial.read();
        }
        return;
    }

    auto handler = s_receiveHandlers.find((MessageType)(s_header.MessageType));

    if(handler == s_receiveHandlers.end())
    {
        receiveInvalid();
    }
    else
    {
        handler->second();
    }

    s_receiveState = NONE;
};