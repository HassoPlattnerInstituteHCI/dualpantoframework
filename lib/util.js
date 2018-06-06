'use strict';

const {isTTY} = process.stdout;
const {isAbsolute} = require('path');

/**
 * All utility functions of the framework. These are exported directly on the framework.
 * @example
 * const {delay} = require('dualpantoframework');
 * // ...
 * await delay(500);
 */
const util = module.exports = {};

const getStack = () => {
	const obj = {};
	Error.captureStackTrace(obj, util.deprecated);
	return obj.stack
		.split('\n')
		.map(s => `\n${s}`);
};

const absoluteStackLine = line => {
	const [, path] = line.match(/\((.*)\)/) || [];
	return path && isAbsolute(path) && !path.startsWith(__dirname);
};

const NO_DEPRECATION = process.env.NODE_ENV === 'test' || process.env.NO_DEPRECATION === '1';

const knownDeprications = new Set();
util.deprecated = (oldName, newName) => {
	if(NO_DEPRECATION)
		return;

	let msg = 'warning:';
	if(isTTY)
		msg = `\u001b[1m${msg}\u001b[22m`;
	msg += ` ${oldName} is deprecated`;
	if(newName)
		msg += `, use ${newName} instead`;

	if(isTTY)
		msg = `\u001b[31m${msg}\u001b[39m`;

	const stack = getStack();
	msg += stack.slice(2)
		.filter(absoluteStackLine)
		.join('');

	if(!knownDeprications.has(msg)) {
		knownDeprications.add(msg);
		console.warn(msg);
	}
};

/**
 * Creates a promise that resolves after a specified time.
 * @param {number} time - time to wait at least befor resolving
 * @returns {Promise} the promise
 * @example
 * await delay(500);
 */
util.delay = time => new Promise(resolve => {
	setTimeout(resolve, time);
});

util.ENUM = {
	*[Symbol.iterator]() {
		for(let i = 0; i < 1e3; i++)
			yield i;
		throw new Error('ENUM end reached, how many enum values do you have???');
	},
};
