#include "utils/performanceMonitor.hpp"

#include <algorithm>
#include <Arduino.h>
#include <cmath>
#include <iomanip>
#include <map>
#include <sstream>
#include <string>
#include <tuple>
#include <vector>

PerformanceMonitor::PerformanceEntry::PerformanceEntry()
{
    m_values.reserve(c_measurementCount);
}

void PerformanceMonitor::start(std::string label)
{
    auto& entry = m_entries[xPortGetCoreID()][label];

    if(entry.m_running)
    {
        return;
    }

    entry.m_running = true;
    entry.m_start = ESP.getCycleCount();
}

void PerformanceMonitor::stop(std::string label)
{
    uint64_t end = ESP.getCycleCount();

    auto& entry = m_entries[xPortGetCoreID()][label];

    if(!entry.m_running)
    {
        return;
    }

    uint64_t duration = 
        entry.m_start < end ?
        (end - entry.m_start) :
        (end + UINT32_MAX - entry.m_start);

    if(entry.m_values.size() == c_measurementCount)
    {
        auto old = entry.m_values[entry.m_index];
        entry.m_sum -= old;

        entry.m_values[entry.m_index] = duration;
        entry.m_sum += duration;
        entry.m_index = (entry.m_index + 1) % c_measurementCount;
    }
    else
    {
        entry.m_values.push_back(duration);
        entry.m_sum += duration;
    }

    entry.m_running = false;
}

std::vector<std::string> PerformanceMonitor::getResults()
{
    std::vector<std::tuple<uint32_t, std::string, double, double>> temp;

    const std::string labelHeader("label");
    const std::string cycleHeader("avg cycles");
    const std::string timeHeader("avg ns");
    uint32_t maxLabelSize = labelHeader.size();
    uint32_t maxCycleSize = cycleHeader.size();
    uint32_t maxTimeSize = timeHeader.size();

    for(const auto& core : m_entries)
    {
        auto coreId = core.first;

        for(const auto& entry : core.second)
        {
            const auto& label = entry.first;
            const auto& data = entry.second;

            const auto avgCycles = (double)data.m_sum / data.m_values.size();
            const auto avgTime = avgCycles / ESP.getCpuFreqMHz();

            maxLabelSize = std::max(
                maxLabelSize,
                label.size() + 4);
            maxCycleSize = std::max(
                maxCycleSize,
                (uint32_t)std::log10(avgCycles) + 1 + 4);
            maxTimeSize = std::max(
                maxTimeSize,
                (uint32_t)std::log10(avgTime) + 1 + 4);

            if(!data.m_values.empty())
            {
                temp.emplace_back(coreId, label, avgCycles, avgTime);
            }
        }
    }

    maxCycleSize = constrain(maxCycleSize, cycleHeader.size(), 30);
    maxTimeSize = constrain(maxTimeSize, timeHeader.size(), 30);

    std::vector<std::string> results;
    std::ostringstream stream;
    stream << std::fixed;

    stream
        << "| "
        << std::setw(maxLabelSize) << std::left
        << labelHeader
        << " | "
        << std::setw(maxCycleSize) << std::left
        << cycleHeader
        << " | "
        << std::setw(maxTimeSize) << std::left
        << timeHeader
        << " |";
    results.emplace_back(stream.str());
    stream.seekp(0);

    stream
        << "|-"
        << std::string(maxLabelSize, '-')
        << "-|-"
        << std::string(maxCycleSize, '-')
        << "-|-"
        << std::string(maxTimeSize, '-')
        << "-|";
    results.emplace_back(stream.str());
    stream.seekp(0);

    for(const auto& tuple : temp)
    {
        stream
            << "| "
            << "["<< std::get<0>(tuple) << "] "
            << std::setw(maxLabelSize - 4) << std::left
            << std::get<1>(tuple)
            << " | "
            << std::setw(maxCycleSize) << std::right << std::setprecision(3) 
            << std::get<2>(tuple)
            << " | "
            << std::setw(maxTimeSize) << std::right << std::setprecision(3) 
            << std::get<3>(tuple)
            << " |";
        results.emplace_back(stream.str());
        stream.seekp(0);
    }

    return results;
}

PerformanceMonitor PerfMon;
