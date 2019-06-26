#include "utils/crashDump.hpp"

#include "utils/serial.hpp"

CrashDump physicsDump;

CrashDump::CrashDump() : m_stream() {}

void CrashDump::clear()
{
    m_stream.clear();
    m_stream.str("");
}

void CrashDump::dump()
{
    DPSerial::sendQueuedDebugLog(m_stream.str().c_str());
    clear();
}
