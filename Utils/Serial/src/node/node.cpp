#include "node/node.hpp"

#include <iostream>

napi_value Node::receiveUInt8(napi_env env, uint16_t &offset)
{
    napi_value result;
    napi_create_uint32(env, DPSerial::receiveUInt8(offset), &result);
    return result;
}

napi_value Node::receiveInt16(napi_env env, uint16_t &offset)
{
    napi_value result;
    napi_create_int32(env, DPSerial::receiveInt16(offset), &result);
    return result;
}

napi_value Node::receiveUInt16(napi_env env, uint16_t &offset)
{
    napi_value result;
    napi_create_uint32(env, DPSerial::receiveUInt16(offset), &result);
    return result;
}

napi_value Node::receiveInt32(napi_env env, uint16_t &offset)
{
    napi_value result;
    napi_create_int32(env, DPSerial::receiveInt32(offset), &result);
    return result;
}

napi_value Node::receiveUInt32(napi_env env, uint16_t &offset)
{
    napi_value result;
    napi_create_uint32(env, DPSerial::receiveUInt32(offset), &result);
    return result;
}

napi_value Node::receiveFloat(napi_env env, uint16_t &offset)
{
    napi_value result;
    napi_create_double(env, DPSerial::receiveFloat(offset), &result);
    return result;
}

void Node::sendUInt8(napi_env env, napi_value value, uint16_t &offset)
{
    uint32_t temp;
    napi_get_value_uint32(env, value, &temp);
    DPSerial::sendUInt8(static_cast<uint8_t>(temp), offset);
}

void Node::sendInt16(napi_env env, napi_value value, uint16_t &offset)
{
    uint32_t temp;
    napi_get_value_uint32(env, value, &temp);
    DPSerial::sendInt16(static_cast<int16_t>(temp), offset);
}

void Node::sendUInt16(napi_env env, napi_value value, uint16_t &offset)
{
    uint32_t temp;
    napi_get_value_uint32(env, value, &temp);
    DPSerial::sendUInt16(static_cast<uint16_t>(temp), offset);
}

void Node::sendInt32(napi_env env, napi_value value, uint16_t &offset)
{
    int32_t temp;
    napi_get_value_int32(env, value, &temp);
    DPSerial::sendInt32(temp, offset);
}

void Node::sendUInt32(napi_env env, napi_value value, uint16_t &offset)
{
    uint32_t temp;
    napi_get_value_uint32(env, value, &temp);
    DPSerial::sendUInt32(temp, offset);
}

void Node::sendFloat(napi_env env, napi_value value, uint16_t &offset)
{
    double temp;
    napi_get_value_double(env, value, &temp);
    DPSerial::sendFloat(static_cast<float>(temp), offset);
}

napi_value Node::open(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value argv[1];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
    }
    size_t length;
    char buffer[64];
    napi_get_value_string_utf8(env, argv[0], buffer, sizeof(buffer), &length);
    if (!setup(buffer))
    {
        napi_throw_error(env, NULL, "open failed");
    }
    napi_value result;
    napi_create_int64(env, reinterpret_cast<int64_t>(s_handle), &result);
    return result;
}

napi_value Node::close(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value argv[1];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
    }
    napi_get_value_int64(env, argv[0], reinterpret_cast<int64_t *>(&s_handle));
    tearDown();
    return NULL;
}

napi_value Node::poll(napi_env env, napi_callback_info info)
{
    // argv[0]: handle
    // argv[1]: device
    // argv[2]: vector constructor
    // argv[3]: sync cb
    // argv[4]: heartbeat cb
    // argv[5]: position cb
    // argv[6]: debug log cb
    size_t argc = 7;
    napi_value argv[7];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
    }
    napi_get_value_int64(env, argv[0], reinterpret_cast<int64_t *>(&s_handle));

    // only keep binary state for packages where only the newest counts
    bool receivedSync = false;
    bool receivedHeartbeat = false;
    bool receivedPosition = false;
    double positionCoords[2 * 5];

    while (getAvailableByteCount(s_handle))
    {
        receivePacket();

        if(s_header.PayloadSize > c_maxPayloadSize)
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
                std::cout
                    << "Received invalid revision id " << receivedRevision
                    << " (expected " << c_revision << ")." << std::endl;
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
            napi_value result;
            napi_create_string_utf8(env, reinterpret_cast<char*>(s_packetBuffer), s_header.PayloadSize, &result);
            napi_call_function(env, argv[1], argv[6], 1, &result, NULL);
            break;
        default:
            break;
        }
    }

    if(receivedSync)
    {
        napi_call_function(env, argv[1], argv[3], 0, NULL, NULL);
    }

    if(receivedHeartbeat)
    {
        napi_call_function(env, argv[1], argv[4], 0, NULL, NULL);
    }

    if (receivedPosition)
    {
        napi_value result;
        napi_create_array(env, &result);

        const uint32_t posArgc = 3;
        const uint32_t goArgc = 2;
        for (auto i = 0u; i < 2; ++i)
        {
            napi_value posArgv[posArgc];

            for (auto j = 0u; j < posArgc; ++j)
            {
                napi_create_double(env, positionCoords[i * 5 + j], &(posArgv[j]));
            }

            napi_value vector;
            NAPI_CHECK(napi_new_instance(env, argv[2], posArgc, posArgv, &vector))
            NAPI_CHECK(napi_set_element(env, result, i * 2, vector));

            napi_value goArgv[goArgc];

            for (auto j = 0u; j < goArgc; ++j)
            {
                napi_create_double(env, positionCoords[i * 5 + 3 + j], &(goArgv[j]));
            }

            NAPI_CHECK(napi_new_instance(env, argv[2], goArgc, goArgv, &vector))
            NAPI_CHECK(napi_set_element(env, result, i * 2 + 1, vector));
        }

        NAPI_CHECK(napi_call_function(env, argv[1], argv[5], 1, &result, NULL));
    }

    return NULL;
}

napi_value Node::send(napi_env env, napi_callback_info info)
{
    size_t argc = 3;
    napi_value argv[3];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
    }
    napi_get_value_int64(env, argv[0], reinterpret_cast<int64_t *>(&s_handle));

    uint32_t messageType;
    napi_get_value_uint32(env, argv[1], &messageType);

    s_header.MessageType = static_cast<MessageType>(messageType);

    uint16_t offset = 0;
    switch (messageType)
    {
    case SYNC_ACK:
        break;
    case HEARTBEAT_ACK:
        break;
    case MOTOR:
    {
        napi_value tempNapiValue;
        uint32_t tempUInt32;
        double tempDouble;
        uint32_t index = 0;

        // control method
        napi_get_element(env, argv[2], index++, &tempNapiValue);
        napi_get_value_uint32(env, tempNapiValue, &tempUInt32);
        DPSerial::sendUInt8(static_cast<uint8_t>(tempUInt32), offset);

        // panto index
        napi_get_element(env, argv[2], index++, &tempNapiValue);
        napi_get_value_uint32(env, tempNapiValue, &tempUInt32);
        DPSerial::sendUInt8(static_cast<uint8_t>(tempUInt32), offset);

        // position
        while (index < 5)
        {
            napi_get_element(env, argv[2], index++, &tempNapiValue);
            napi_get_value_double(env, tempNapiValue, &tempDouble);
            DPSerial::sendFloat(static_cast<float>(tempDouble), offset);
        }
        break;
    }
    case PID:
    {
        napi_value propertyName;
        napi_value tempNapiValue;
        uint32_t tempUInt32;

        napi_create_string_utf8(env, "motorIndex", NAPI_AUTO_LENGTH, &propertyName);
        napi_get_property(env, argv[2], propertyName, &tempNapiValue);
        napi_get_value_uint32(env, tempNapiValue, &tempUInt32);
        DPSerial::sendUInt8(static_cast<uint8_t>(tempUInt32), offset);

        napi_create_string_utf8(env, "pid", NAPI_AUTO_LENGTH, &propertyName);
        napi_get_property(env, argv[2], propertyName, &tempNapiValue);
        napi_value pidNapiValue;
        double pidDouble;
        for (auto i = 0; i < 3; ++i)
        {
            napi_get_element(env, tempNapiValue, i, &pidNapiValue);
            napi_get_value_double(env, pidNapiValue, &pidDouble);
            DPSerial::sendFloat(static_cast<float>(pidDouble), offset);
        }
        break;
    }
    case CREATE_OBSTACLE:
    case ADD_TO_OBSTACLE:
    {
        napi_value propertyName;
        napi_value tempNapiValue;
        uint32_t tempUInt32;

        napi_create_string_utf8(env, "index", NAPI_AUTO_LENGTH, &propertyName);
        napi_get_property(env, argv[2], propertyName, &tempNapiValue);
        napi_get_value_uint32(env, tempNapiValue, &tempUInt32);
        DPSerial::sendUInt8(static_cast<uint8_t>(tempUInt32), offset);

        napi_create_string_utf8(env, "id", NAPI_AUTO_LENGTH, &propertyName);
        napi_get_property(env, argv[2], propertyName, &tempNapiValue);
        napi_get_value_uint32(env, tempNapiValue, &tempUInt32);
        DPSerial::sendUInt16(static_cast<uint16_t>(tempUInt32), offset);

        napi_create_string_utf8(env, "posArray", NAPI_AUTO_LENGTH, &propertyName);
        napi_get_property(env, argv[2], propertyName, &tempNapiValue);
        uint32_t posArraySize;
        napi_get_array_length(env, tempNapiValue, &posArraySize);
        napi_value posNapiValue;
        double posDouble;
        for (auto i = 0; i < posArraySize; ++i)
        {
            napi_get_element(env, tempNapiValue, i, &posNapiValue);
            napi_get_value_double(env, posNapiValue, &posDouble);
            DPSerial::sendFloat(static_cast<float>(posDouble), offset);
        }
        break;
    }
    case REMOVE_OBSTACLE:
    case ENABLE_OBSTACLE:
    case DISABLE_OBSTACLE:
    {
        napi_value propertyName;
        napi_value tempNapiValue;
        uint32_t tempUInt32;

        napi_create_string_utf8(env, "index", NAPI_AUTO_LENGTH, &propertyName);
        napi_get_property(env, argv[2], propertyName, &tempNapiValue);
        napi_get_value_uint32(env, tempNapiValue, &tempUInt32);
        DPSerial::sendUInt8(static_cast<uint8_t>(tempUInt32), offset);

        napi_create_string_utf8(env, "id", NAPI_AUTO_LENGTH, &propertyName);
        napi_get_property(env, argv[2], propertyName, &tempNapiValue);
        napi_get_value_uint32(env, tempNapiValue, &tempUInt32);
        DPSerial::sendUInt16(static_cast<uint16_t>(tempUInt32), offset);
        break;
    }
    case DUMP_HASHTABLE:
    {
        napi_value propertyName;
        napi_value tempNapiValue;
        uint32_t tempUInt32;

        napi_create_string_utf8(env, "index", NAPI_AUTO_LENGTH, &propertyName);
        napi_get_property(env, argv[2], propertyName, &tempNapiValue);
        napi_get_value_uint32(env, tempNapiValue, &tempUInt32);
        DPSerial::sendUInt8(static_cast<uint8_t>(tempUInt32), offset);
        break;
    }
    default:
        napi_throw_error(env, NULL, (std::string("Invalid message type") + std::to_string(messageType)).c_str());
        return NULL;
    }

    #ifdef DEBUG_LOGGING
    std::cout << "Payload size: 0x" << std::setw(2) << offset << std::endl;
    #endif

    if(offset > c_maxPayloadSize)
    {
        std::cout << "Error: payload size of " << offset << " exceeds max payload size (" << c_maxPayloadSize << ")." << std::endl;
        return NULL;
    }

    s_header.PayloadSize = offset;
    sendPacket();

    #ifdef DEBUG_LOGGING
    dumpBuffers();
    #endif

    return NULL;
}

#define defFunc(name, ptr)                                             \
    if (napi_create_function(env, NULL, 0, ptr, NULL, &fn) != napi_ok) \
    {                                                                  \
        napi_throw_error(env, NULL, "Unable to wrap native function"); \
    }                                                                  \
    if (napi_set_named_property(env, exports, name, fn) != napi_ok)    \
    {                                                                  \
        napi_throw_error(env, NULL, "Unable to populate exports");     \
    }

napi_value Init(napi_env env, napi_value exports)
{
    napi_value fn;
    defFunc("open", Node::open);
    defFunc("close", Node::close);
    defFunc("poll", Node::poll);
    defFunc("send", Node::send);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)