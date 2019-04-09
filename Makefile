ifeq ($(OS),Windows_NT)
	PLATFORMIO = %userprofile%/.platformio/penv/Scripts/platformio
	RM = del /s /q /f
	CC = cl /Fo:Utils\\Serial\\
else
	ifeq (, $(shell which platformio))
		PLATFORMIO = ~/.platformio/penv/bin/platformio
	else
		PLATFORMIO = platformio
	endif
	RM = rm -rdf
	UNAME_S := $(shell uname -s)
	ifeq ($(UNAME_S),Linux)
		CC = g++
	endif
	ifeq ($(UNAME_S),Darwin)
		CC = clang++
	endif
endif

all:
	@echo Don't run make directly. Please use the provided npm run commands instead.

platformio:
	"$(PLATFORMIO)" run -t $(command) -d Firmware

ifeq ($(OS),Windows_NT)
delete:
	$(RM) "$(subst /,\,$(target))"
else
delete:
	$(RM) "$(target)"
endif

serial-plugin:
	node-gyp configure
	node-gyp build

serial-standalone:
	$(CC) Utils/Serial/serial.cpp Protocol/lib/protocol.cpp -IProtocol/include -o Utils/Serial/serial
