#include "task.hpp"

#include <soc/timer_group_reg.h>
#include <soc/timer_group_struct.h>

#include "framerateLimiter.hpp"
#include "performanceMonitor.hpp"
#include "serial.hpp"

std::map<TaskHandle_t, uint32_t> Task::s_fpsMap;
FramerateLimiter loggingLimiter = FramerateLimiter::fromSeconds(1);

void Task::taskLoop(void *parameters)
{
    Task *task = reinterpret_cast<Task *>(parameters);

#if LOG_TASK_FPS
    task->initFps();
#endif

    task->m_setupFunc();

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
    m_fpsCalcLimiter.reset();
    m_loopCount = 0;
};

inline void Task::checkFps()
{
    ++m_loopCount;
    if (m_fpsCalcLimiter.step())
    {
        s_fpsMap[m_handle] = m_loopCount * 1000 / m_fpsInterval;
        m_loopCount = 0;

        if(m_logFps && loggingLimiter.step())
        {
            for(const auto& entry : s_fpsMap)
            {
                DPSerial::sendDebugLog(
                    "Task \"%s\" fps: %i",
                    pcTaskGetTaskName(entry.first),
                    entry.second);
            }

            #ifdef ENABLE_PERFMON
            for(const auto& entry : PerfMon.getResults())
            {
                DPSerial::sendDebugLog(entry.c_str());
            }
            #endif
        }
    }
};

Task::Task(void (*setupFunc)(), void (*loopFunc)(), const char *name, int core)
    : m_setupFunc(setupFunc),
      m_loopFunc(loopFunc),
      m_name(name),
      m_stackDepth(c_defaultStackDepth),
      m_priority(c_defaultPriority),
      m_core(core),
      m_fpsInterval(c_defaultFpsInterval),
      m_fpsCalcLimiter(FramerateLimiter::fromMilliseconds(m_fpsInterval)){};

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

TaskHandle_t Task::getHandle()
{
    return m_handle;
}
