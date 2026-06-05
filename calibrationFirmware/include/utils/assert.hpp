#pragma once

#include "utils/serial.hpp"

void __fail(
    const char* check, std::string val1, std::string val2,
    const char* file, int line, const char* func)
{
    DPSerial::sendInstantDebugLog(
        "Assertion %s failed with values %s and %s: file \"%s\", line %i, %s",
        check, val1.c_str(), val2.c_str(), file, line, func);
    abort();
}

#define __CHECK(operator, val1, val2) (val1 operator val2) ?\
    (void)0 :\
    __fail(\
        #val1 " " #operator " " #val2,\
        std::to_string(val1), std::to_string(val2),\
        __FILE__, __LINE__, __PRETTY_FUNCTION__);

#define ASSERT_EQ(val1, val2) __CHECK(==, val1, val2)
#define ASSERT_LT(val1, val2) __CHECK(<, val1, val2)
#define ASSERT_LE(val1, val2) __CHECK(<=, val1, val2)
#define ASSERT_GT(val1, val2) __CHECK(>, val1, val2)
#define ASSERT_GE(val1, val2) __CHECK(>=, val1, val2)
#define ASSERT_NE(val1, val2) __CHECK(!=, val1, val2)
