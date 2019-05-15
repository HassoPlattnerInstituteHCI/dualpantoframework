#include "performanceMonitor.hpp"

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

    entry.m_start = micros();
    entry.m_running = true;
}

void PerformanceMonitor::stop(std::string label)
{
    auto& entry = m_entries[xPortGetCoreID()][label];

    if(!entry.m_running)
    {
        return;
    }

    auto diff = micros() - entry.m_start;

    if(entry.m_values.size() == c_measurementCount)
    {
        auto old = entry.m_values[entry.m_index];
        entry.m_sum -= old;

        entry.m_values[entry.m_index] = diff;
        entry.m_sum += diff;
        entry.m_index = (entry.m_index + 1) % c_measurementCount;
    }
    else
    {
        entry.m_values.push_back(diff);
        entry.m_sum += diff;
    }

    entry.m_running = false;
}

std::vector<std::string> PerformanceMonitor::getResults()
{
    std::vector<std::tuple<uint32_t, std::string, double>> temp;

    const std::string labelHeader("label");
    const std::string valueHeader("avg us");
    uint32_t maxLabelSize = labelHeader.size();
    uint32_t maxValueSize = valueHeader.size();

    for(const auto& core : m_entries)
    {
        auto coreId = core.first;

        for(const auto& entry : core.second)
        {
            const auto& label = entry.first;
            const auto& data = entry.second;

            maxLabelSize = std::max(
                maxLabelSize,
                label.size() + 4);
            maxValueSize = std::max(
                maxValueSize,
                (uint32_t)std::log10(
                    (double)data.m_sum / data.m_values.size()) + 1 + 4);

            if(!data.m_values.empty())
            {
                temp.emplace_back(coreId, label, (double)data.m_sum / data.m_values.size());
            }
        }
    }

    maxValueSize = constrain(maxValueSize, valueHeader.size(), 30);

    std::vector<std::string> results;
    std::ostringstream stream;
    stream << std::fixed;

    stream
        << "| "
        << std::setw(maxLabelSize) << std::left
        << labelHeader 
        << " | "
        << std::setw(maxValueSize) << std::left
        << valueHeader 
        << " |";
    results.emplace_back(stream.str());
    stream.seekp(0);

    stream
        << "|-"
        << std::string(maxLabelSize, '-')
        << "-|-"
        << std::string(maxValueSize, '-')
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
            << std::setw(maxValueSize) << std::right << std::setprecision(3) 
            << std::get<2>(tuple) 
            << " |";
        results.emplace_back(stream.str());
        stream.seekp(0);
    }

    return results;
}

PerformanceMonitor PerfMon;
