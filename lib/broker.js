'use strict';

const EventEmitter = require('events');
const co = require('co');
const VoiceInteraction = require('./voice-interaction');
const Device = require('./device');

/* eslint-disable */
function* conditional_promise_generator(promise_list, condition_fn) {
	for(let i = 0; condition_fn() && i < promise_list.length; i++)
		yield promise_list[i]();
}
/* eslint-enable */

/**
 * Class for device handling and basic functions
 * @extends EventEmitter
 * @prop {Map<string, Device>} devices - map of connected devices
 * @prop {number} disconnectTimeout - timeout after which a device gets disconnected
 */
class Broker extends EventEmitter {
	/**
	 * Create a Brocker object.
	 */
	constructor() {
		super();
		this.devices = new Map();
		this.prevDevices = new Set();

		// in seconds
		this.disconnectTimeout = 5;
		this.voiceInteraction = new VoiceInteraction();
	}

	/**
	 * Creates a script that executes a list of promises.
	 * @deprecated **use async / await instead**
	 * @param {array} promise_list - the list of promises to execute.
	 * @example
	 * // OLD: run_script syntax:
	 * device.on('handleMoved', (index, position) => {
	 *     run_script([
	 *         () => device.movePantoTo(0, new Vector(1, 2, 0)),
	 *         () => DualPantoFramework.waitMS(500),
	 *         () => device.movePantoTo(1, new Vector(4, 5, 0)),
	 *     ]);
	 * });
	 * // NEW: async / await syntax:
	 * device.on('handleMoved', async (index, position) => {
	 *     await device.movePantoTo(0, new Vector(1, 2, 0));
	 *     await DualPantoFramework.waitMS(500);
	 *     await device.movePantoTo(1, new Vector(4, 5, 0));
	 * });
	 */
	/* eslint-disable camelcase */
	run_script(promise_list) {
		this._running_script = true;
		const script_generator = conditional_promise_generator(promise_list, () => this._running_script);
		co(script_generator)
			.catch(console.log);
	}
	/* eslint-enable camelcase */

	/**
	 * Generates a promise that creates a timeout.
	 * @param {number} ms - number ob ms to wait.
	 * @returns {Promise} The promise executing the timeout.
	 * @example
	 * await DualPantoFramework.waitMS(500);
	 */
	// eslint-disable-next-line class-methods-use-this
	waitMS(ms) {
		return new Promise(resolve => setTimeout(() => resolve(resolve), ms));
	}

	/**
	 * Returns all connected devices.
	 * @returns {Set} The connected devices.
	 * @example
	 * for(const device of DualPantoFramework.getDevices()) {
	 *     console.log(device);
	 * }
	 */
	getDevices() {
		return new Set(this.devices.values());
	}

	/**
	 * Returns the device connected to a specific port
	 * @param {string} port - the port of the device
	 * @returns {Device} The connected device.
	 * @private
	 */
	getDeviceByPort(port) {
		return this.devices.get(port);
	}

	/**
	 * Creates a new virtual device
	 * @returns {Device} The new virtual device.
	 * @private
	 */
	// eslint-disable-next-line class-methods-use-this
	createVirtualDevice() {
		return new Device('virtual');
	}
}

module.exports = Broker;
