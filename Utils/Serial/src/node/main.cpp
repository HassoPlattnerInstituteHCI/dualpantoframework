#include "node.hpp"

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
