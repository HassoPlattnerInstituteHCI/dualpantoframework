#include "task.hpp"
#include "soc/timer_group_struct.h"
#include "soc/timer_group_reg.h"

std::map<TaskHandle_t, uint32_t> Task::s_fpsMap;

void Task::taskLoop(void *parameters)
{
    Task *task = reinterpret_cast<Task *>(parameters);

#if LOG_TASK_FPS
    task->initFps();
#endif
loopLabel:
    task->m_loopFunc();
#if LOG_TASK_FPS
    task->checkFps();
#endif
    TIMERG0.wdt_wprotect=TIMG_WDT_WKEY_VALUE;
    TIMERG0.wdt_feed=1;
    TIMERG0.wdt_wprotect=0;
    goto loopLabel;
};

inline void Task::initFps()
{
    m_lastTime = millis();
    m_loopCount = 0;
};

inline void Task::checkFps()
{
    ++m_loopCount;
    m_currentTime = millis();
    if (m_currentTime >= m_lastTime + m_fpsInterval)
    {
        s_fpsMap[m_handle] = m_loopCount * 1000 / m_fpsInterval;
        m_lastTime = m_currentTime;
        m_loopCount = 0;

        if(m_logFps)
        {
            for(auto& entry : s_fpsMap)
            {
                DPSerial::sendDebugLog(
                    "Task \"%s\" fps: %i",
                    pcTaskGetTaskName(entry.first),
                    entry.second);
            }
        }
    }
};

Task::Task(void (*loopFunc)(), const char *name, int core)
    : m_loopFunc(loopFunc),
      m_name(name),
      m_stackDepth(c_defaultStackDepth),
      m_priority(c_defaultPriority),
      m_core(core),
      m_fpsInterval(c_defaultFpsInterval){};

void Task::run()
{
    xTaskCreatePinnedToCore(
        taskLoop,
        m_name,
        m_stackDepth,
        this,
        m_priority,
        &m_handle,
        m_core);
    DPSerial::sendDebugLog("Started task \"%s\" on core %i.", m_name, m_core);
};

void Task::setLogFps(bool logFps)
{
    m_logFps = logFps;
}