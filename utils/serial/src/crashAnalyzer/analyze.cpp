#include "crashAnalyzer.hpp"

#include <array>
#include <cstdlib>
#include <iostream>
#include <fstream>
#include <regex>
#include <sstream>
#include "libInterface.hpp"

#ifdef WINDOWS
#include <stdio.h>
#define popen _popen
#define pclose _pclose
#endif

#ifdef __APPLE__
#define popen popen
#define pclose pclose
#endif

const std::string CrashAnalyzer::c_rebootString = "Rebooting...";
const std::string CrashAnalyzer::c_backtraceString = "Backtrace:";

bool CrashAnalyzer::findString(
    uint16_t startOffset,
    uint16_t endOffset,
    const std::string string,
    uint16_t &foundOffset)
{
    const auto length = string.length();
    int32_t index = length - 1;
    auto offset = startOffset;

    while (index > -1 && offset <= endOffset)
    {
        if (getChar(offset) == string.at(index))
        {
            index--;
        }
        else
        {
            index = length - 1;
        }
        offset++;
    }

    if (index == -1)
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
    for (auto i = startOffset; i >= endOffset; --i)
    {
        data.at(startOffset - i) = getChar(i);
    }
    std::regex regex("(0x.{8}):0x.{8}");
    auto it = std::sregex_iterator(data.begin(), data.end(), regex);
    auto end = std::sregex_iterator();

    std::vector<std::string> result;
    while (it != end)
    {
        result.push_back((*it++).str(1));
    }

    return result;
}

char *exec(const char *cmd)
{
    loggingHandler((char *)cmd);

    std::array<char, 1024> buffer;
    std::string result;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd, "r"), pclose);
    if (!pipe)
    {
        loggingHandler("Popen failed");
        return "popen() failed!";
    }
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != NULL)
    {
        loggingHandler(buffer.data());
        //result += buffer.data();
    }
    char *cstr = new char[result.length() + 1];
    strcpy(cstr, result.c_str());
    // do stuff
    delete[] cstr;
    return cstr;
}

void CrashAnalyzer::addr2line(std::vector<std::string> addresses)
{
    std::cout << std::endl
              << "===== STACKTRACE BEGIN =====" << std::endl;

    loggingHandler("===== STACKTRACE BEGIN =====");
#ifdef __APPLE__
#define ADDR2LINE_PATH "~/.platformio/packages/toolchain-xtensa32/bin/xtensa-esp32-elf-addr2line"
#define FIRMWARE_PATH "/Users/julio/Documents/Uni/5_Master/HCI_Project_Seminar/dualpantoframework/firmware/.pio/build/esp32dev/firmware.elf"
#endif
#ifdef ADDR2LINE_PATH
    std::ostringstream command;
    command
        << ADDR2LINE_PATH
        << " -e " << FIRMWARE_PATH
        << " -fpCis"; // see https://linux.die.net/man/1/addr2line
    for (const auto &address : addresses)
    {
        command << " " << address;
    }

    command << " 2>&1";
    auto result = exec(command.str().c_str());

    std::ostringstream out;
    out << "Stacktrace (most recent call first):" << std::endl
        << result;
#else
    loggingHandler("Path to addr2line executable not set. Can't analyze stacktrace.");
    std::cout
        << "Path to addr2line executable not set. Can't analyze stacktrace."
        << std::endl;

#endif

    std::cout << "====== STACKTRACE END ======" << std::endl;
}

void CrashAnalyzer::checkOutput()
{
    uint16_t rebootOffset;
    if (!findString(
            0,
            c_rebootString.length(),
            c_rebootString,
            rebootOffset))
    {
        return;
    }

    uint16_t backtraceOffset;
    if (!findString(
            rebootOffset,
            s_length,
            c_backtraceString,
            backtraceOffset))
    {
        std::cout << "Reboot detected, but no backtrace found." << std::endl;
        return;
    }
    char out[c_bufferLength + 1];
    std::memcpy(out, s_buffer, c_bufferLength);
    out[c_bufferLength] = '\0';
    for (int i = 0; i < c_bufferLength; i++)
    {
        char x = s_buffer[i];
        if (x < 32 || x > 126)
        {
            // space
            x = 32;
        }
        out[i] = x;
    }
    loggingHandler("ERROR!");
    loggingHandler(out);
    auto addresses = getBacktraceAddresses(
        backtraceOffset - c_backtraceString.length() - 1,
        rebootOffset);

    addr2line(addresses);
    clearBuffer();
}
