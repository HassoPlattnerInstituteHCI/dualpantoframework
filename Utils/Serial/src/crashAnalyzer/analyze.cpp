#include "crashAnalyzer.hpp"

#include <cstdlib>
#include <iostream>
#include <fstream>
#include <regex>
#include <sstream>

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
    auto offset = startOffset;

    while (index > -1 && offset <= endOffset)
    {
        if(getChar(offset) == string.at(index))
        {
            index--;
        } else {
            index = length - 1;
        }
        offset++;
    }

    if(index == -1)
    {
        foundOffset = offset;
        return true;
    }

    return false;
}

std::vector<std::string> CrashAnalyzer::getBacktraceAddresses(
    uint16_t startOffset, uint16_t endOffset)
{
    std::string data(startOffset - endOffset + 1, 'a');
    for(auto i = startOffset; i >= endOffset; --i)
    {
        data.at(startOffset - i) = getChar(i);
    }
    std::regex regex("(0x.{8}):0x.{8}");
    auto it = std::sregex_iterator(data.begin(), data.end(), regex);
    auto end = std::sregex_iterator();

    std::vector<std::string> result;
    while(it != end)
    {
        result.push_back((*it++).str(1));
    }

    return result;
}

void CrashAnalyzer::addr2line(std::vector<std::string> addresses)
{
    #ifdef ADDR2LINE_PATH

    char outputFile[L_tmpnam];
    std::tmpnam(outputFile);

    std::ostringstream command;
    command
        << ADDR2LINE_PATH
        << " -e ./Firmware/.pio/build/esp32dev/firmware.elf"
        << " -fpCis" // see https://linux.die.net/man/1/addr2line
        << " > " << outputFile;
    for (const auto &address : addresses)
    {
        command << " " << address;
    }

    std::system(command.str().c_str());

    std::cout << "Stacktrace (most recent call first):" << std::endl;
    {
        std::ifstream output(outputFile);
        std::cout << output.rdbuf();
    }

    std::remove(outputFile);

    #else

    std::cout
        << "Path to addr2line executable not set. Can't analyze stacktrace."
        << std::endl;
    return;

    #endif
}

void CrashAnalyzer::checkOutput()
{
    uint16_t rebootOffset;
    if(!findString(
        0,
        c_rebootString.length(),
        c_rebootString,
        rebootOffset))
    {
        return;
    }
    std::cout << std::endl << "Reboot detected." << std::endl;

    dumpBuffer();

    uint16_t backtraceOffset;
    if(!findString(
        rebootOffset,
        s_length,
        c_backtraceString,
        backtraceOffset))
    {
        return;
    }

    auto addresses = getBacktraceAddresses(
        backtraceOffset - c_backtraceString.length() - 1,
        rebootOffset);

    addr2line(addresses);
    clearBuffer();
}
