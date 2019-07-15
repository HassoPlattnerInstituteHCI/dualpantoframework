#pragma once

#include <string>
#include <vector>

class CrashAnalyzer
{
private:
    static const uint16_t c_bufferLength = 1024;
    static uint8_t s_buffer[c_bufferLength];
    static uint16_t s_length;
    static uint16_t s_index;

    static void clearBuffer();
    static bool detectReboot();
    static std::vector<std::string> findBacktraceAdresses();
public:
    static void push_back(const uint8_t character);
};
