#include "node.hpp"

napi_value Node::receiveUInt8(napi_env env, uint16_t& offset)
{
    napi_value result;
    napi_create_uint32(env, DPSerial::receiveUInt8(offset), &result);
    return result;
}

napi_value Node::receiveInt16(napi_env env, uint16_t& offset)
{
    napi_value result;
    napi_create_int32(env, DPSerial::receiveInt16(offset), &result);
    return result;
}

napi_value Node::receiveUInt16(napi_env env, uint16_t& offset)
{
    napi_value result;
    napi_create_uint32(env, DPSerial::receiveUInt16(offset), &result);
    return result;
}

napi_value Node::receiveInt32(napi_env env, uint16_t& offset)
{
    napi_value result;
    napi_create_int32(env, DPSerial::receiveInt32(offset), &result);
    return result;
}

napi_value Node::receiveUInt32(napi_env env, uint16_t& offset)
{
    napi_value result;
    napi_create_uint32(env, DPSerial::receiveUInt32(offset), &result);
    return result;
}

napi_value Node::receiveFloat(napi_env env, uint16_t& offset)
{
    napi_value result;
    napi_create_double(env, DPSerial::receiveFloat(offset), &result);
    return result;
}
