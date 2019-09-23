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

void CrashAnalyzer::dumpBuffer()
{
    std::cout << "Index: " << s_index << std::endl;
    std::cout << "Length: " << s_length << "/" << c_bufferLength << std::endl;
    std::cout << "### begin dump ###" << std::endl;

    const auto fill = std::cout.fill('0');
    char character;
    for (
        uint16_t dumpIndex = 0;
        dumpIndex < c_bufferLength;
        dumpIndex += c_dumpLineWidth)
    {
        std::cout << "0x" << std::setw(8) << dumpIndex << " | ";
        for(uint16_t lineIndex = 0; lineIndex < c_dumpLineWidth; ++lineIndex)
        {
            std::cout << ensurePrintable(s_buffer[dumpIndex + lineIndex]);
            if((lineIndex + 1) % 8 == 0)
            {
                std::cout << " | ";
            }
        }
        std::cout << std::endl;
    }
    std::cout.fill(fill);
    std::cout << "### end dump ###" << std::endl;
}

uint8_t CrashAnalyzer::getChar(uint16_t offset)
{
    return s_buffer[SAFEMOD((s_index - offset), c_bufferLength)];
}

char CrashAnalyzer::ensurePrintable(uint8_t character)
{
    return (character < 0x20 || character > 0x7E ? '?' : character);
}

void CrashAnalyzer::push_back(const uint8_t character)
{
    s_buffer[s_index] = character;
    s_index = (s_index + 1) % c_bufferLength;
    s_length = (s_length >= c_bufferLength) ? c_bufferLength : (s_length + 1);

    checkOutput();
}
