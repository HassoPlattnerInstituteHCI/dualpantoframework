#include "serial.hpp"
#include "panto.hpp"

DPSerial::Header DPSerial::s_header = DPSerial::Header();
DPSerial::ReceiveState DPSerial::s_receiveState = NONE;
bool DPSerial::s_connected = false;
int DPSerial::s_unacknowledgedHeartbeats = 0;

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
    sendMagicNumber();
    sendHeader(SYNC, 4);
    sendUInt32(c_revision);
};

void DPSerial::sendHeartbeat()
{
    sendMagicNumber();
    sendHeader(HEARTBEAT, 0);
};

void DPSerial::sendPosition()
{
    sendMagicNumber();
    sendHeader(POSITION, pantoCount * 3 * 4); // three values per panto, 4 bytes each
    
    for(auto i = 0; i < pantoCount; ++i)
    {
        sendFloat(pantos[i].handle.x);
        sendFloat(pantos[i].handle.y);
        sendFloat(pantos[i].pointingAngle);
    }
};

void DPSerial::sendDebugLog(std::string message)
{
    sendMagicNumber();
    sendHeader(DEBUG_LOG, message.length());
    Serial.print(message.c_str());
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

// receive

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
    return true;
};

bool DPSerial::payloadReady()
{
    return Serial.available() >= s_header.PayloadSize;
};

void DPSerial::receiveSyncAck()
{
    // TODO
    sendDebugLog("receiveSyncAck");
};

void DPSerial::receiveHearbeatAck()
{
    // TODO
    sendDebugLog("receiveHearbeatAck");
};

void DPSerial::receiveMotor()
{
    // TODO
    sendDebugLog("receiveMotor");
};

void DPSerial::receivePID()
{
    // TODO
    sendDebugLog("receivePID");
};

void DPSerial::receiveInvalid()
{
    // TODO
    sendDebugLog("receiveInvalid");
};

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

void DPSerial::testSend()
{
    sendDebugLog("Sending sync...");
    sendSync();
    sendDebugLog("Sending heartbeat...");
    sendHeartbeat();
    sendDebugLog("Sending position...");
    sendPosition();
    sendDebugLog("Sending debug log...");
    sendDebugLog("whoa");
};