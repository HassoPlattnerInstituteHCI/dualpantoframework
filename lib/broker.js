'use strict';

const EventEmitter = require('events');
const usb = require('usb');
const SerialPort = require('serialport');
const VoiceInteraction = require('./voice-interaction');
const Device = require('./device');
const {deprecated, delay} = require('./util');
const startVisualDebugger = require('./visual-debugger');
const {Easing} = require('./tween-generator');

const VIRTUAL = 'virtual';

const DUAL_PANTO_MANUFACTURERES = ['Arduino LLC', 'Atmel Corp. at91sam SAMBA bootloader'];

const isDualPanto = port => {
	if(port.vendorId && port.vendorId === '2341')
		return true;
	if(port.manufacturer) {
		for(const manufacturer of DUAL_PANTO_MANUFACTURERES) {
			if(port.manufacturer.includes(manufacturer))
				return true;
		}
	}
	return false;
};

const devicesChangedDepricated = () => deprecated("broker.on('devicesChanged', fn)", "broker.on('device', fn) and device.on('disconnect', fn)");

/**
 * Class for device handling and basic functions
 * @extends EventEmitter
 * @prop {Map<string, Device>} devices - map of connected devices
 * @prop {number} disconnectTimeout - timeout after which a device gets disconnected
 */
class Broker extends EventEmitter {
	/**
	 * Create a Brocker object.
	 * @param {Object} [options] - broker options
	 * @param {number} [options.defaultSpeed] - default speed for movements (overwrites duration)
	 * @param {number} [options.defaultDuration = 500] - default duration for movements
	 * @param {Object} [options.defaultInterpolationMethod] - default interpolation method for movements
	 * @param {Object} [options.defaultLanguage = 'DE'] - default language for spoken text
	 * @param {Object} [options.defaultSpeechSpeed = 1.4] - default speed for spoken text
	 */
	constructor(options = {}) {
		super();
		this.deviceMap = new Map();
		this.physicalDevices = new Set();

		// in seconds
		this.disconnectTimeout = 5;
		this._voiceInteraction = new VoiceInteraction(this);

		const {
			defaultSpeed = null,
			defaultDuration = 500,
			defaultInterpolationMethod = Easing.Quadratic.Out,
			defaultLanguage = 'DE',
			defaultSpeechSpeed = 1.4,
			visualDebugger = {},
			deviceAutodetection = true,
		} = options;

		this.defaultSpeed = defaultSpeed;
		this.defaultDuration = defaultDuration;
		this.defaultInterpolationMethod = defaultInterpolationMethod;

		this.defaultLanguage = defaultLanguage;
		this.defaultSpeechSpeed = defaultSpeechSpeed;

		this.serialRecvCounter = 0;

		if(visualDebugger) {
			const {
				port = 8080,
			} = visualDebugger;
			startVisualDebugger(this, port);
		}

		if(deviceAutodetection)
			this.enableDeviceAutodetection();
	}

	/*
	 ****************************************************************
	 * --> deprecated utility methods
	 ****************************************************************
	 */

	get voiceInteraction() {
		deprecated('broker.voiceInteraction', 'device.seyText(text) and others');
		return this._voiceInteraction;
	}

	/**
	 * Creates a script that executes a list of promises.
	 * @deprecated **use async / await instead**
	 * @param {array} promiseList - the list of promises to execute
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
	// eslint-disable-next-line camelcase
	async run_script(promiseList) {
		deprecated('broker.run_script(promiseList)', 'async/await');
		try {
			for(const promise of promiseList)
				await promise();
		} catch(err) {
			this.emit('error', err);
		}
	}

	/**
	 * Generates a promise that creates a timeout.
	 * @deprecated **use delay instead**
	 * @param {number} ms - number ob ms to wait.
	 * @returns {Promise} The promise executing the timeout.
	 * @example
	 * await broker.waitMS(500);
	 */
	// eslint-disable-next-line class-methods-use-this
	async waitMS(ms) {
		deprecated('broker.waitMS(ms)', 'delay(ms)');
		await delay(ms);
	}

	/*
	 ****************************************************************
	 * --> voice interaction related methods
	 ****************************************************************
	 */

	setCommands(commands) {
		this._voiceInteraction.setCommands(commands);
		this._voiceInteraction.beginListening();
	}

	/*
	 ****************************************************************
	 * --> device related methods
	 ****************************************************************
	 */

	getDevices() {
		deprecated('broker.getDevices()', 'broker.devices');
		return this.devices;
	}

	/**
	 * Iterator over all connected devices.
	 * @type {Iterator<Device>}
	 * @example
	 * for(const device of broker.devices) {
	 *     console.log(device);
	 * }
	 */
	get devices() {
		return this.deviceMap.values();
	}

	/**
	 * Returns the device connected to a specific port
	 * @param {string} port - the port of the device
	 * @returns {Device} the connected device
	 * @private
	 */
	getDeviceByPort(port) {
		return this.deviceMap.get(port);
	}

	/**
	 * Creates a new device.
	 * @param {string} port - see {@link Device}
	 * @param {string} isVirtual - see {@link Device}
	 * @returns {Device} the new device
	 * @private
	 */
	createDevice(port, isVirtual) {
		return new Device(this, port, isVirtual);
	}

	/**
	 * Creates a new virtual device.
	 * @returns {Device} the new virtual device
	 * @private
	 */
	createVirtualDevice() {
		let i = 0;
		while(this.deviceMap.has(VIRTUAL + i))
			i++;
		return this.createDevice(VIRTUAL + i, true);
	}

	/**
	 * Adds a device to the map of connected devices.
	 * Used by the {@link Device} constructor.
	 * @param {Device} device - the device to add
	 * @private
	 */
	addDevice(device) {
		this.deviceMap.set(device.port, device);
		if(!device.isVirtual)
			this.physicalDevices.add(device);

		console.log('dual panto: connected:', device.port);
		this.emit('device', device);
		if(this.emit('devicesChanged', this.devices, [device], []))
			devicesChangedDepricated();
	}

	/**
	 * Removes a device from the map of connected devices.
	 * Used by the {@link Device#disconnect} method.
	 * @param {Device} device - the device to remove
	 * @private
	 */
	removeDevice(device) {
		this.deviceMap.delete(device.port);
		if(!device.isVirtual)
			this.physicalDevices.delete(device);

		console.log('dual panto: disconnected:', device.port);
		if(this.emit('devicesChanged', this.devices, [], [device]))
			devicesChangedDepricated();
	}

	/*
	 ****************************************************************
	 * --> autodetection methods
	 ****************************************************************
	 */

	async autoDetectDevices() {
		let ports = null;
		try {
			ports = await SerialPort.list();
		} catch(err) {
			this.emit('error', err);
			return;
		}

		for(const port of ports) {
			if(isDualPanto(port)) {
				const {comName} = port;
				if(!this.deviceMap.has(comName))
					this.createDevice(comName);
			}
		}
	}

	enableDeviceAutodetection() {
		const autoDetectDevices = () => {
			this.autoDetectDevices();
		};
		usb.on('attach', autoDetectDevices);
		usb.on('detach', autoDetectDevices);

		return this.autoDetectDevices();
	}
}

module.exports = Broker;
