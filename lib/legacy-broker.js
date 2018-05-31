'use strict';

/*
 * Some javascript magic to lazy initalize a backward compatible
 * broker instance. This module exports an onstance of the Broker class,
 * but the constructor is only called once a method or property of the
 * broker is accessed.
 */

const Broker = require('./Broker');
const {deprecated} = require('./util');

const NOOP = () => {
	// no operation
};

// create an instance without calling the constructor
const emptyBroker = Object.create(Broker.prototype);

let legacyBroker = null;

let handler = null;
let init = () => {
	init = NOOP;
	legacyBroker = new Broker();
	deprecated('DualPantoFramework', 'new Broker()');
};

handler = {
	get: (target, prop) => {
		if(emptyBroker.hasOwnProperty(prop))
			return emptyBroker[prop];
		init();
		return legacyBroker[prop];
	},
	set: (target, prop, value) => {
		if(emptyBroker.hasOwnProperty(prop)) {
			emptyBroker[prop] = value;
			return value;
		}
		init();
		legacyBroker[prop] = value;
		return value;
	},
};

const proxyBroker = new Proxy(emptyBroker, handler);

module.exports = {
	emptyBroker,
	proxyBroker,
};
