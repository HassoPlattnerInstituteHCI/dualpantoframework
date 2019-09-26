#!/bin/bash
# Use this to analyze the ESP32's backtrace in case of a crash.
# Requires gdb to be accessable from bash.
# In order to find line numbers, add -g3 to the PlatformIO build flags.
# The default target is set for running this script from the base framework dir.
# Alternatively, you may pass an path to the elf as the first argument.
# Default usage: ./utils/backtrace/backtrace.sh "0x40085698:0x3ffb5e80 [...]"
# Alternative usage example for running from this dir: ./backtrace.sh ./../../firmware/.pioenvs/esp32dev/firmware.elf "0x40085698:0x3ffb5e80 [...]"

if [ "$#" -eq 1 ]; then
    target=./firmware/.pioenvs/esp32dev/firmware.elf
    backtrace=$1
    echo "Using default target $target"
else
    target=$1
    backtrace=$2
    echo "Using custom target $1"
fi

file=$(mktemp)
echo $backtrace \
| sed -r 's/:0x[[:xdigit:]]{8}\s?/\n/g' \
| sed '/^[[:space:]]*$/d' \
| sed 's/^.*$/echo === \0 ===\\n\ninfo symbol \0\ninfo line *\0/g' > $file
gdb -batch -x $file $target
rm $file
