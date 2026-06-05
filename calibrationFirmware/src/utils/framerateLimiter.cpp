#include "utils/framerateLimiter.hpp"

#include "utils/serial.hpp"

uint64_t FramerateLimiter::s_period = 0;
uint64_t FramerateLimiter::s_lastNow = 0;

uint64_t FramerateLimiter::now()
{
    uint64_t now = micros();
    if(now < s_lastNow)
    {
        ++s_period;
        DPSerial::sendQueuedDebugLog("FramerateLimiter: micros() rolled over.");
    }
    return s_period * c_periodLength + now;
}

FramerateLimiter::FramerateLimiter(uint64_t microseconds)
: m_delta(microseconds)
, m_last(0) { }

FramerateLimiter FramerateLimiter::fromFPS(double fps)
{
    return FramerateLimiter(1e6 / fps);
}

FramerateLimiter FramerateLimiter::fromSeconds(uint64_t seconds)
{
    return FramerateLimiter(1000000 * seconds);
}

FramerateLimiter FramerateLimiter::fromMilliseconds(uint64_t milliseconds)
{
    return FramerateLimiter(1000 * milliseconds);
}

FramerateLimiter FramerateLimiter::fromMicroseconds(uint64_t microseconds)
{
    return FramerateLimiter(microseconds);
}

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

void FramerateLimiter::reset()
{
    m_last = FramerateLimiter::now();
}
