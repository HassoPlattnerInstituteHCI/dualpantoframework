#include "crashAnalyzer.hpp"

uint8_t CrashAnalyzer::s_buffer[c_bufferLength];
uint16_t CrashAnalyzer::s_length = 0;
uint16_t CrashAnalyzer::s_index = 0;

void CrashAnalyzer::clearBuffer()
{
    // TODO: reset index and stored length
}

void CrashAnalyzer::push_back(const uint8_t character)
{
    // TODO: write to buffer at index, increase index (wrap around) and length
    // (only up to c_bufferSize)
}
