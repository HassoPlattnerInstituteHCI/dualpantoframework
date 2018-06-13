'use strict';

const configs = [];

const deviceConfig = module.exports = {
	configs,
};

/* eslint-disable global-require */
try {
	configs[0] = require('./0');
} catch(err) {
	// no 0.js file (used for test configurations)
}

// require all device configurations
for(let i = 1; i < 2; i++)
	configs[i] = require(`./${i}`);

configs.virtual = require('./virtual');

const modifierMap = Object.create(null);

deviceConfig.loadConfig = async id => {
	const config = configs[id];
	const modifier = modifierMap[id];
	if(modifier) {
		for(const modify of modifier)
			await modify(config);
		modifierMap[id] = undefined;
	}
	return config;
};

deviceConfig.addModifier = (id, modifier) => {
	if(modifierMap[id] === undefined)
		modifierMap[id] = [];
	modifierMap[id].push(modifier);
};
