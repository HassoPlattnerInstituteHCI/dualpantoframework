#pragma once

#include <Arduino.h>
#include <map>

#include "utils/framerateLimiter.hpp"
#include "tasks/taskFunction.hpp"

class Task
{
private:
    // default values
    static const uint32_t c_defaultStackDepth = 8192;
    static const uint32_t c_defaultPriority = 1;
    static const uint32_t c_defaultFpsInterval = 1000;

    // task data
    TaskFunction m_setupFunc;
    TaskFunction m_loopFunc;
    const char* m_name;
    uint32_t m_stackDepth;
    uint32_t m_priority;
    TaskHandle_t m_handle;
    int m_core;

    // task function
    static void taskLoop(void* parameters);

    // fps counter data
    uint32_t m_fpsInterval;
    FramerateLimiter m_fpsCalcLimiter;
    uint32_t m_loopCount;
    static std::map<TaskHandle_t, uint32_t> s_fpsMap;
    bool m_logFps;

    // fps counter funcs
    inline void initFps();
    inline void checkFps();
public:
    Task(
        TaskFunction setupFunc,
        TaskFunction loopFunc,
        const char* name,
        int core);
    void run();
    void setLogFps(bool logFps = true);
    TaskHandle_t getHandle();
};
