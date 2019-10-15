#include "libInterface.hpp"

#include <iostream>

uint32_t CppLib::getRevision()
{
    return c_revision;
}

loggingHandler_t loggingHandler;

// can't export any member functions, not even static ones
// thus we'll have to add wrappers for everything

#define ALIAS(alias, func) alias { return CppLib::func; }

ALIAS(uint32_t GetRevision(), getRevision())

void SERIAL_EXPORT SetLoggingHandler(loggingHandler_t handler)
{
    loggingHandler = handler;
    loggingHandler("Ground control to major Tom");
}
