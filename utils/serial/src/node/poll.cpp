#include "node.hpp"

#include <iostream>

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
    napi_get_value_int64(env, argv[0], reinterpret_cast<int64_t*>(&s_handle));

    // only keep binary state for packages where only the newest counts
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
                std::cout
                    << "Received invalid revision id " << receivedRevision
                    << " (expected " << c_revision << "). Maybe try reset the device?" << std::endl;
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
