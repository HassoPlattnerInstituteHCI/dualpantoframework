#include "task.hpp"

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
        DPSerial::sendDebugLog(
            "Task \"%s\" fps: %i",
            m_name,
            m_loopCount * 1000 / m_fpsInterval);
        m_lastTime = m_currentTime;
        m_loopCount = 0;
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
