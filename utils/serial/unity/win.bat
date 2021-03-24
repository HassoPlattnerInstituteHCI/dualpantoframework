SET SOURCE_DIR=utils\serial
SET BUILD_DIR=utils\serial\cppLibBuild

cmake %SOURCE_DIR%  -G"Visual Studio 15 2017 Win64" -S %SOURCE_DIR% -B %BUILD_DIR%
cmake --build  %BUILD_DIR% --config RelWithDebInfo