#include "crashAnalyzer.hpp"

#include <array>
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
        }
        else
        {
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

std::string exec(const char* cmd) {
    #ifdef WINDOWS
    #define popen _popen
    #define pclose _pclose
    #endif
    #ifdef __APPLE__
    #define popen popen
    #define pclose pclose
    #endif

    std::array<char, 128> buffer;
    std::string result;

    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd, "r"), pclose);
    if (!pipe) {
        return "popen() failed!";
    }
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    return result;
}

void CrashAnalyzer::addr2line(std::vector<std::string> addresses)
{
    std::cout << std::endl << "===== STACKTRACE BEGIN =====" << std::endl;

    #ifdef ADDR2LINE_PATH
    std::ostringstream command;
    command
        << ADDR2LINE_PATH
        << " -e ./firmware/.pio/build/esp32dev/firmware.elf"
        << " -fpCis"; // see https://linux.die.net/man/1/addr2line
    for (const auto &address : addresses)
    {
        command << " " << address;
    }

    const auto result = exec(command.str().c_str());

    std::ostringstream out;
    out
        << "Stacktrace (most recent call first):" << std::endl
        << result;
    #else
    std::cout
        << "Path to addr2line executable not set. Can't analyze stacktrace."
        << std::endl;

    #endif

    std::cout << "====== STACKTRACE END ======" << std::endl;
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

    uint16_t backtraceOffset;
    if(!findString(
        rebootOffset,
        s_length,
        c_backtraceString,
        backtraceOffset))
    {
        std::cout << "Reboot detected, but no backtrace found." << std::endl;
        return;
    }
    
    auto addresses = getBacktraceAddresses(
        backtraceOffset - c_backtraceString.length() - 1,
        rebootOffset);

    addr2line(addresses);
    clearBuffer();
}
