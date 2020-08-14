#include "node.hpp"

#include <iostream>

napi_value Node::send(napi_env env, napi_callback_info info)
{
    size_t argc = 3;
    napi_value argv[3];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
    {
        napi_throw_error(env, NULL, "Failed to parse arguments");
    }
    napi_get_value_int64(env, argv[0], reinterpret_cast<int64_t*>(&s_handle));

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
    case CREATE_PASSABLE_OBSTACLE:
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
    case CREATE_RAIL:
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
        double displacement;
        napi_get_value_double(env, tempNapiValue, &displacement);
        DPSerial::sendFloat(static_cast<float>(displacement), offset);
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
    case CALIBRATE_PANTO:{
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
