'use strict';

const {Message} = require('../protocol');
const {ENUM} = require('../util');

const PROTOCOL_VERSION = 1;

const [
	COMMAND_GET_CONFIG,
	COMMAND_START,
	COMMAND_ENCODER_VALUES,
] = ENUM;

/**
 * Messages that can be send.
 * @private
 */
const messages = {

	/**
	 * Create a getConfig message.
	 * @param {number} version the protocol version number
	 * @returns {Message} the getConfig message
	 */
	getConfigCommand: version => {
		const msg = new Message();
		msg.command = COMMAND_GET_CONFIG;
		msg.writeByte(version);
		return msg;
	},

	/**
	 * Create a start message.
	 * @param {number} interval the update interval in microseconds
	 * @returns {Message} the start message
	 */
	startCommand: interval => {
		const msg = new Message();
		msg.command = COMMAND_START;
		msg.writeInt32(interval);
		return msg;
	},

	/**
	 * Create a setMotors message.
	 * Write the power values of an array of motors.
	 * @param {Motor[]} motors the list of motors
	 * @returns {Message} the setMotors message
	 */
	setMotorsCommand: motors => {
		const msg = new Message();
		msg.command = COMMAND_ENCODER_VALUES;
		for(const motor of motors)
			msg.writeInt16(motor.power * motor.maxPower);

		return msg;
	},
};

const {getConfigCommand, setMotorsCommand} = messages;

/**
 * The protocol handler for a device.
 * @private
 */
const handlers = {

	/**
	 * Called once a connecten to the physical device is established.
	 * @listens Protocol#open
	 */
	open() {
		this.protocol.send(getConfigCommand(PROTOCOL_VERSION));
	},

	/**
	 * Called ince the connection gets closed.
	 * @listens Protocol#close
	 */
	close() {
		this.disconnect();
	},

	/**
	 * Called when a config message arrives.
	 * @param {Message} msg the cofig message
	 * @listens Protocol#config
	 */
	config(msg) {
		if(this.configLoaded) {
			console.warn('Device: config already loaded');
			return;
		}
		this.configLoaded = true;

		this.pwmBits = msg.readByte();
		this.pwmMax = (1 << this.pwmBits) - 1;

		const numMotors = msg.readByte();

		const configurationID = msg.readUInt32();

		const deviceIDLength = msg.readByte();
		this.deviceID = Buffer.from(msg.readBuffer(deviceIDLength));

		const maxPowers = [];
		for(let i = 0; i < numMotors; i++)
			maxPowers.push(msg.readUInt16());

		// done with the sync part, do the rest async
		this.loadConfig(configurationID, maxPowers);
	},

	/**
	 * Called when a encoderValues message arrives.
	 * @param {Message} msg the encoderValues message
	 * @listens Protocol#encoderValues
	 */
	encoderValues(msg) {
		if(!this.configLoaded) {
			msg.ignore();
			return;
		}

		const deltaTime = msg.readUInt32();
		for(const motor of this.motors)
			motor.steps = msg.readInt32();

		this.updateMotorPowers(deltaTime);
		this.protocol.send(setMotorsCommand(this.motors));
	},
};

module.exports = {
	...messages,
	handlers,
	messages,

	/**
	 * Setup the handlers to listen to portocol events and of a device.
	 * @param {Device} device the device to use
	 * @param {Protocol} protocol the protocol to use
	 * @private
	 */
	handleCommands(device, protocol) {
		for(const key of Object.keys(handlers))
			protocol.on(key, handlers[key].bind(device));
	},
};
