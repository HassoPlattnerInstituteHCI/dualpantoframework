all: serial
	node-gyp configure
	node-gyp build

%:	Hardware/%.json GenerateConfig.js
	node GenerateConfig.js $@
