#pragma once

#include "serial/serial.hpp"

#if __has_include("node_api.h")
#include <node_api.h>
#elif __has_include("node/node_api.h")
#include <node/node_api.h>
#endif
#define NAPI_CHECK(code) \
    if (code != napi_ok) \
        std::cerr << "NOT OK: " << __FILE__ << ":" << __LINE__ << std::endl;

static napi_value nodeReceiveUInt8(napi_env env, uint16_t &offset);
static napi_value nodeReceiveInt16(napi_env env, uint16_t &offset);
static napi_value nodeReceiveUInt16(napi_env env, uint16_t &offset);
static napi_value nodeReceiveInt32(napi_env env, uint16_t &offset);
static napi_value nodeReceiveUInt32(napi_env env, uint16_t &offset);
static napi_value nodeReceiveFloat(napi_env env, uint16_t &offset);

static void nodeSendUInt8(napi_env env, napi_value value, uint16_t &offset);
static void nodeSendInt16(napi_env env, napi_value value, uint16_t &offset);
static void nodeSendUInt16(napi_env env, napi_value value, uint16_t &offset);
static void nodeSendInt32(napi_env env, napi_value value, uint16_t &offset);
static void nodeSendUInt32(napi_env env, napi_value value, uint16_t &offset);
static void nodeSendFloat(napi_env env, napi_value value, uint16_t &offset);

static napi_value nodeOpen(napi_env env, napi_callback_info info);
static napi_value nodeClose(napi_env env, napi_callback_info info);
static napi_value nodePoll(napi_env env, napi_callback_info info);
static napi_value nodeSend(napi_env env, napi_callback_info info);
