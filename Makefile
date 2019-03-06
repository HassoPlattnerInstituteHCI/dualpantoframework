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

all: serial mab_opt2k4_dir_esp32
	node-gyp configure --debug
	node-gyp build --debug

serial:
	$(CC) Utils/Serial/serial.cpp Protocol/lib/protocol.cpp -IProtocol/include -o Utils/Serial/serial

%: Hardware/%.json Firmware/GenerateHardwareConfig.js
	node Firmware/GenerateHardwareConfig.js $@
