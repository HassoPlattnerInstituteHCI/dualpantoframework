#pragma once

#include <cstdint>

#include "serial.hpp"
#include "serial_export.hpp"

class CppLib : DPSerial
{
public:
    static uint32_t getRevision();
};

// can't export any member functions, not even static ones
// thus we'll have to add wrappers for everything

extern "C"
{
    uint32_t SERIAL_EXPORT GetRevision();
    void SERIAL_EXPORT CallMeMaybe(void (*target)());
};
