#pragma once

#include <signal.h>

#include "api/base.hpp"

class Standalone : public Api
{
public:
    static void printPacket();
};
