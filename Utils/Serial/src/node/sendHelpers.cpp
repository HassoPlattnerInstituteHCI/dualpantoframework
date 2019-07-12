#include "node.hpp"

void Node::sendUInt8(napi_env env, napi_value value, uint16_t& offset)
{
    uint32_t temp;
    napi_get_value_uint32(env, value, &temp);
    DPSerial::sendUInt8(static_cast<uint8_t>(temp), offset);
}

void Node::sendInt16(napi_env env, napi_value value, uint16_t& offset)
{
    uint32_t temp;
    napi_get_value_uint32(env, value, &temp);
    DPSerial::sendInt16(static_cast<int16_t>(temp), offset);
}

void Node::sendUInt16(napi_env env, napi_value value, uint16_t& offset)
{
    uint32_t temp;
    napi_get_value_uint32(env, value, &temp);
    DPSerial::sendUInt16(static_cast<uint16_t>(temp), offset);
}

void Node::sendInt32(napi_env env, napi_value value, uint16_t& offset)
{
    int32_t temp;
    napi_get_value_int32(env, value, &temp);
    DPSerial::sendInt32(temp, offset);
}

void Node::sendUInt32(napi_env env, napi_value value, uint16_t& offset)
{
    uint32_t temp;
    napi_get_value_uint32(env, value, &temp);
    DPSerial::sendUInt32(temp, offset);
}

void Node::sendFloat(napi_env env, napi_value value, uint16_t& offset)
{
    double temp;
    napi_get_value_double(env, value, &temp);
    DPSerial::sendFloat(static_cast<float>(temp), offset);
}
