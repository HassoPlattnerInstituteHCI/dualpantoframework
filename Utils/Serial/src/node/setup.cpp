#include "node.hpp"

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
    napi_get_value_int64(env, argv[0], reinterpret_cast<int64_t*>(&s_handle));
    tearDown();
    return NULL;
}
