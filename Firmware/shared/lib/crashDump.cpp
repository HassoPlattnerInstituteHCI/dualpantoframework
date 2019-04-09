#include "crashDump.hpp"

#include "serial.hpp"

CrashDump physicsDump;

CrashDump::CrashDump() : m_stream() {}

void CrashDump::clear()
{
    m_stream.clear();
    m_stream.str("");
}

void CrashDump::dump()
{
    DPSerial::sendDebugLog(m_stream.str().c_str());
    clear();
}
