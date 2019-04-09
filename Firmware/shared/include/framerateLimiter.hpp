#pragma once

#include <Arduino.h>
#include <limits.h>

class FramerateLimiter
{
private:
    uint64_t m_delta;
    uint64_t m_last;
    static const uint64_t c_periodLength = ULONG_MAX;
    static uint64_t s_period;
    static uint64_t s_lastNow;
    static uint64_t now();
public:
    FramerateLimiter(double targetFps);
    bool step();
};
