#include "crashAnalyzer.hpp"

#include <iostream>

const std::string CrashAnalyzer::c_rebootString = "Rebooting...";
const std::string CrashAnalyzer::c_backtraceString = "Backtrace:";

bool CrashAnalyzer::findString(
        uint16_t startOffset,
        uint16_t endOffset,
        const std::string string,
        uint16_t& foundOffset)
{
    const auto length = string.length();
    int32_t index = length - 1;
    auto offset = 0;

    while (index > -1 && offset < endOffset)
    {
        if(getChar(offset) == string.at(index))
        {
            index--;
        } else {
            index = length - 1;
        }
        offset++;
    }

    if(index == 0)
    {
        foundOffset = offset;
        return true;
    }

    return false;
}

std::vector<std::string> CrashAnalyzer::getBacktraceAdresses(
        uint16_t startOffset, uint16_t endOffset)
{
    // TODO: go backwards, grab all space-seperated words until "Backtrace:" is
    // found, split them up at ':' to remove data adresses
}
