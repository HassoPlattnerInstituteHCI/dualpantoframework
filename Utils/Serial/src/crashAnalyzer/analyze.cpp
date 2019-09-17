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

void CrashAnalyzer::gdb(std::vector<std::string> addresses)
{
    #ifdef GDB_AVAILABLE

    char gdbScriptFile[L_tmpnam];
    std::tmpnam(gdbScriptFile);
    {
        std::ofstream gdbScript(gdbScriptFile);
        for (const auto& address : addresses)
        {
            gdbScript << "echo === " << address << " ===\\n" << std::endl;
            gdbScript << "info symbol " << address << std::endl;
            gdbScript << "info line *" << address << std::endl;
        }
    }

    char gdbOutputFile[L_tmpnam];
    std::tmpnam(gdbOutputFile);
    const auto binFile = "./Firmware/.pio/build/esp32dev/firmware.elf";

    std::ostringstream gdbCommand;
    gdbCommand << "gdb -batch -x " << gdbScriptFile << " " << binFile;

    std::ostringstream bashCommand;
    #ifdef WINDOWS
    auto inner = gdbCommand.str();
    std::replace(inner.begin(), inner.end(), '\\', '/');
    const auto cpos = inner.find("C:");
    inner.replace(cpos, 2, "/mnt/c");
    std::string bashExe;
    switch (sizeof(void*))
    {
    case 4:
        bashExe = "C:\\Windows\\Sysnative\\bash";
        break;
    case 8:
        bashExe = "bash";
        break;
    default:
        std::cout << "Unsure where to find bash. Guessing just bash.";
        return;
    }
    std::cout << "Using bash located in " << bashExe << std::endl;
    bashCommand << bashExe << " -c \"" << inner << "\" > " << gdbOutputFile;
    #else
    bashCommand << gdbCommand.str() << " > " << gdbOutputFile;
    #endif

    std::cout << "Running " << bashCommand.str() << std::endl;
    std::system(bashCommand.str().c_str());

    {
        std::ifstream gdbOutput(gdbOutputFile);
        std::cout << "Result: " << gdbOutput.rdbuf() << std::endl;
    }

    std::remove(gdbScriptFile);
    std::remove(gdbOutputFile);

    #else

    std::cout
        << "Install gdb to analyze the stacktrace." << std::endl;

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
    std::cout << std::endl << ">>> [reboot detected]" << std::endl;

    uint16_t backtraceOffset;
    if(!findString(
        rebootOffset,
        s_length,
        c_backtraceString,
        backtraceOffset))
    {
        return;
    }
    std::cout << ">>> [backtrace found]" << std::endl;

    auto addresses = getBacktraceAddresses(
        backtraceOffset - c_backtraceString.length() - 1,
        rebootOffset);

    std::cout << ">>> [stack addresses]" << std::endl;

    for (const auto& address : addresses)
    {
        std::cout << address << std::endl;
    }

    std::cout << ">>> [analyzing stack]" << std::endl;
    gdb(addresses);
    std::cout << ">>> [clearing buffer]" << std::endl;
    clearBuffer();
}
