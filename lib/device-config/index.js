'use strict';

const configs = [];

/**
 * The device configuration loader.
 * @private
 */
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

/**
 * Load a device configuration.
 * @param {number|string} id the configuration id (a number or `'virtual'`)
 * @returns {Object} the device configuration
 */
deviceConfig.loadConfig = id => {
	const config = configs[id];
	return config;
};
