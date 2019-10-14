#include "libInterface.hpp"

uint32_t CppLib::getRevision()
{
    return c_revision;
}

// can't export any member functions, not even static ones
// thus we'll have to add wrappers for everything

#define ALIAS(alias, func) alias { return CppLib::func; }

ALIAS(uint32_t GetRevision(), getRevision())
