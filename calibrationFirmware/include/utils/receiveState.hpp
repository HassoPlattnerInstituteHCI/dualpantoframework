#pragma once

enum ReceiveState
{
    NONE = 0,
    FOUND_MAGIC = 1,
    FOUND_HEADER = 2
};
