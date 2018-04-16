all: serial LP_PCB
	node-gyp configure
	node-gyp build

%: Hardware/%.json Firmware/GenerateHardwareConfig.js
	node Firmware/GenerateHardwareConfig.js $@
