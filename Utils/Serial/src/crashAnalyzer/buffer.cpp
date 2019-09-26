#include "crashAnalyzer.hpp"

#include <iomanip>
#include <iostream>

uint8_t CrashAnalyzer::s_buffer[c_bufferLength];
uint16_t CrashAnalyzer::s_length = 0;
uint16_t CrashAnalyzer::s_index = 0;

void CrashAnalyzer::clearBuffer()
{
    s_index = 0;
    s_length = 0;
}

uint8_t CrashAnalyzer::getChar(uint16_t offset)
{
    return s_buffer[SAFEMOD((s_index - offset), c_bufferLength)];
}

void CrashAnalyzer::push_back(const uint8_t character)
{
    s_buffer[s_index] = character;
    s_index = (s_index + 1) % c_bufferLength;
    s_length = (s_length >= c_bufferLength) ? c_bufferLength : (s_length + 1);

    checkOutput();
}
