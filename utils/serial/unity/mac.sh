SOURCE_DIR="./utils/serial"
BUILD_DIR="./utils/serial/cppLibBuild"

cmake $SOURCE_DIR -G"Xcode" -S $SOURCE_DIR -B $BUILD_DIR
cmake --build  $BUILD_DIR --config Release
