ifeq ($(OS),Windows_NT)
    CC = cl
else
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Linux)
        CC = g++
    endif
    ifeq ($(UNAME_S),Darwin)
        CC = clang
    endif
endif

all: serial LP_PCB
	node-gyp configure
	node-gyp build

serial:
	$(CC) serial.cpp Protocol/protocol.cpp -o serial

%: Hardware/%.json Firmware/GenerateHardwareConfig.js
	node Firmware/GenerateHardwareConfig.js $@
