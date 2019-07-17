#pragma once

#include <sstream>

class CrashDump
{
private:
    std::ostringstream m_stream;
public:
    CrashDump();
    void clear();
    void dump();
    template<class T> CrashDump& operator<<(T value)
    {
        m_stream << value;
        return *this;
    }
};

#ifdef ENABLE_CRASHDUMP
#define CRASHDUMP(dump, call) dump call
#else
#define CRASHDUMP(dump, call)
#endif

extern CrashDump physicsDump;
