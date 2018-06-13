'use strict';

const {Message} = require('../protocol');
const {ENUM} = require('../util');

const PROTOCOL_VERSION = 1;

const [
	COMMAND_GET_CONFIG,
	COMMAND_START,
	COMMAND_ENCODER_VALUES,
] = ENUM;

const messages = {
	getConfigCommand: version => {
		const msg = new Message();
		msg.command = COMMAND_GET_CONFIG;
		msg.writeByte(version);
		return msg;
	},
	startCommand: interval => {
		const msg = new Message();
		msg.command = COMMAND_START;
		msg.writeInt32(interval);
		return msg;
	},
	setMotorsCommand: motors => {
		const msg = new Message();
		msg.command = COMMAND_ENCODER_VALUES;
		for(const motor of motors)
			msg.writeInt16(motor.power * motor.maxPower);

		return msg;
	},
};

const {getConfigCommand, setMotorsCommand} = messages;

const handlers = {
	open() {
		this.protocol.send(getConfigCommand(PROTOCOL_VERSION));
	},

	close() {
		this.disconnect();
	},

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
	handleCommands(device, protocol) {
		for(const key of Object.keys(handlers))
			protocol.on(key, handlers[key].bind(device));
	},
};
