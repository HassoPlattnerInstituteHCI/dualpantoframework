ifeq ($(OS),Windows_NT)
    CC = cl /Fo:Utils\\Serial\\
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
	$(CC) Utils/Serial/serial.cpp Protocol/protocol.cpp -o Utils/Serial/serial

%: Hardware/%.json Firmware/GenerateHardwareConfig.js
	node Firmware/GenerateHardwareConfig.js $@
