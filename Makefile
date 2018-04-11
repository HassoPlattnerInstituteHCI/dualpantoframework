all: serial
	node-gyp configure
	node-gyp build

%:	Hardware/%.json Utils/GenerateHardwareConfig.js
	node Utils/GenerateHardwareConfig.js $@
