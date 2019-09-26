#pragma once

#include <string>
#include <vector>

#define SAFEMOD(a, b) ((a) % (b) + (b)) % (b)

class CrashAnalyzer
{
private:
    static const uint16_t c_bufferLength = 1024;
    static const uint16_t c_dumpLineWidth = 32;
    static uint8_t s_buffer[c_bufferLength];
    static uint16_t s_length;
    static uint16_t s_index;

    static void clearBuffer();
    static uint8_t getChar(uint16_t offset);

    static const std::string c_rebootString;
    static const std::string c_backtraceString;

    static bool findString(
        uint16_t startOffset,
        uint16_t endOffset,
        const std::string string,
        uint16_t& foundOffset);
    static std::vector<std::string> getBacktraceAddresses(
        uint16_t startOffset, uint16_t endOffset);
    static void addr2line(std::vector<std::string> addresses);

    static void checkOutput();
public:
    static void push_back(const uint8_t character);
};
