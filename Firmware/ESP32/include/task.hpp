#pragma once

#include <Arduino.h>
#include <map>

// enable/disable debug logging here
#define LOG_TASK_FPS true

class Task
{
private:
    // default values
    static const uint32_t c_defaultStackDepth = 8192;
    static const uint32_t c_defaultPriority = 1;
    static const uint32_t c_defaultFpsInterval = 1000;

    // task data
    void (*m_setupFunc)();
    void (*m_loopFunc)();
    const char *m_name;
    uint32_t m_stackDepth;
    uint32_t m_priority;
    TaskHandle_t m_handle;
    int m_core;

    // task function
    static void taskLoop(void *parameters);

    // fps counter data
    uint32_t m_fpsInterval;
    uint32_t m_lastTime;
    uint32_t m_currentTime;
    uint32_t m_loopCount;
    static std::map<TaskHandle_t, uint32_t> s_fpsMap;
    bool m_logFps;

    // fps counter funcs
    inline void initFps();
    inline void checkFps();
public:
    Task(void (*setupFunc)(), void (*loopFunc)(), const char *name, int core);
    void run();
    void setLogFps(bool logFps = true);
    TaskHandle_t getHandle();
};
