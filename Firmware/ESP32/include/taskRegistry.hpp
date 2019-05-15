#pragma once

#include <map>
#include <string>

#include "task.hpp"

typedef std::map<std::string, Task> TaskRegistry;
extern TaskRegistry Tasks;
