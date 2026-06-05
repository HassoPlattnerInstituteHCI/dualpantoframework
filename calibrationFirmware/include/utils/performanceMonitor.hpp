#pragma once

#include <map>
#include <string>
#include <vector>

class PerformanceMonitor
{
private:
    static const uint32_t c_measurementCount = 1000;
    struct PerformanceEntry
    {
        std::vector<uint64_t> m_values;
        uint32_t m_index = 0;
        uint64_t m_sum = 0;
        bool m_running = false;
        uint64_t m_start = 0;
        PerformanceEntry();
    };
    std::map<uint32_t, std::map<std::string, PerformanceEntry>> m_entries;
public:
    void start(std::string label);
    void stop(std::string label);
    std::vector<std::string> getResults();
};

#ifdef ENABLE_PERFMON
#define PERFMON_START(label) PerfMon.start(label);
#define PERFMON_STOP(label) PerfMon.stop(label);
#else
#define PERFMON_START(label)
#define PERFMON_STOP(label)
#endif

extern PerformanceMonitor PerfMon;
