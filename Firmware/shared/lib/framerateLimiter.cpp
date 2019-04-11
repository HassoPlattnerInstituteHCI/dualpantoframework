#include "framerateLimiter.hpp"

#include <Arduino.h>

#include "serial.hpp"

uint64_t FramerateLimiter::s_period = 0;
uint64_t FramerateLimiter::s_lastNow = 0;

uint64_t FramerateLimiter::now()
{
    uint64_t now = micros();
    if(now < s_lastNow)
    {
        ++s_period;
        DPSerial::sendDebugLog("FramerateLimiter: micros() rolled over.");
    }
    return s_period * c_periodLength + now;
}

FramerateLimiter::FramerateLimiter(double targetFps)
: m_delta(1e6 / targetFps)
, m_last(0) { }

bool FramerateLimiter::step()
{
    uint64_t now = FramerateLimiter::now();
    if(m_last + m_delta > now)
    {
        return false;
    }
    m_last = now;
    return true;
}
