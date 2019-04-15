#pragma once

#include <Arduino.h>
#include <limits.h>

class FramerateLimiter
{
private:
    static const uint64_t c_periodLength = ULONG_MAX;
    static uint64_t s_period;
    static uint64_t s_lastNow;
    static uint64_t now();
    uint64_t m_delta;
    uint64_t m_last;
    FramerateLimiter(uint64_t microseconds);
public:
    static FramerateLimiter fromFPS(double fps);
    static FramerateLimiter fromSeconds(uint64_t seconds);
    static FramerateLimiter fromMilliseconds(uint64_t milliseconds);
    static FramerateLimiter fromMicroseconds(uint64_t microseconds);
    bool step();
    void reset();
};
