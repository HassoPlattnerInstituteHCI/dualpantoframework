#pragma once

#include "serial.hpp"

#if __has_include("node_api.h")
#include <node_api.h>
#elif __has_include("node/node_api.h")
#include <node/node_api.h>
#endif
#define NAPI_CHECK(code) \
    if (code != napi_ok) \
        std::cerr << "NOT OK: " << __FILE__ << ":" << __LINE__ << std::endl;

// enable for debugging
// #define DEBUG_LOGGING

class Node : public DPSerial
{
private:
    static napi_value receiveUInt8(napi_env env, uint16_t& offset);
    static napi_value receiveInt16(napi_env env, uint16_t& offset);
    static napi_value receiveUInt16(napi_env env, uint16_t& offset);
    static napi_value receiveInt32(napi_env env, uint16_t& offset);
    static napi_value receiveUInt32(napi_env env, uint16_t& offset);
    static napi_value receiveFloat(napi_env env, uint16_t& offset);

    static void sendUInt8(napi_env env, napi_value value, uint16_t& offset);
    static void sendInt16(napi_env env, napi_value value, uint16_t& offset);
    static void sendUInt16(napi_env env, napi_value value, uint16_t& offset);
    static void sendInt32(napi_env env, napi_value value, uint16_t& offset);
    static void sendUInt32(napi_env env, napi_value value, uint16_t& offset);
    static void sendFloat(napi_env env, napi_value value, uint16_t& offset);

public:
    static napi_value open(napi_env env, napi_callback_info info);
    static napi_value close(napi_env env, napi_callback_info info);
    static napi_value poll(napi_env env, napi_callback_info info);
    static napi_value send(napi_env env, napi_callback_info info);
};
