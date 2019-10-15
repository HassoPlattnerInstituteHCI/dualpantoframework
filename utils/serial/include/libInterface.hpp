#pragma once

#include <cstdint>

#include "serial.hpp"
#include "serial_export.hpp"

class CppLib : DPSerial
{
public:
    static uint32_t getRevision();
};

typedef void (*loggingHandler_t)(char*);
extern loggingHandler_t loggingHandler;

// can't export any member functions, not even static ones
// thus we'll have to add wrappers for everything

extern "C"
{
    uint32_t SERIAL_EXPORT GetRevision();
    void SERIAL_EXPORT SetLoggingHandler(loggingHandler_t handler);
};
