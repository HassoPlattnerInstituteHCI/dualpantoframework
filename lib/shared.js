'use strict';

// shared objects, these shared object should not be needed

// @TODO: refactor to remove shared (global) objects

const Broker = require('./broker');

const broker = new Broker();

module.exports = {
	broker,
};
