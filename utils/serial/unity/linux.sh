#!/bin/sh
cmake .. -G"Unix Makefiles" -S".." -B"../cppLibBuild" -DCMAKE_BUILD_TYPE=Release
cmake --build "../cppLibBuild" --config Release
