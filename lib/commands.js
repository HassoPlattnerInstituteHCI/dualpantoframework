'use strict';

const Motor = require('./motor');
const Handle = require('./handle');
const Message = require('./message');
const Vector = require('../Vector');
const {ENUM} = require('./util');

const HANDLE_NAMES = ['unnamed', 'me', 'it'];

const PROTOCOL_VERSION = 1;
const DEFAULT_INTERVAL = 300;

const [
	COMMAND_GET_CONFIG,
	COMMAND_START,
	COMMAND_ENCODER_VALUES,
] = ENUM;

const messages = {
	getConfig: version => {
		const msg = new Message();
		msg.command = COMMAND_GET_CONFIG;
		msg.writeByte(version);
		return msg;
	},
	start: interval => {
		const msg = new Message();
		msg.command = COMMAND_START;
		msg.writeInt32(interval);
		return msg;
	},
	setMotors: motors => {
		const msg = new Message();
		msg.command = COMMAND_ENCODER_VALUES;
		for(const motor of motors)
			msg.writeInt16(motor.power);
		return msg;
	},
};

const {getConfig, start, setMotors} = messages;

const handlers = {
	open() {
		this.protocol.send(getConfig(PROTOCOL_VERSION));
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
		this.pwmMax = 1 << this.pwmBits;
		if(msg.readByte() !== 0)
			throw new Error('Device: the dual panto is using big endian byte order, this is not supported');
		const numMotors = msg.readByte();
		const numHandles = Math.floor(numMotors / 3);

		this.minDist = msg.readFloat();
		this.pidFactor = {
			p: msg.readFloat(),
			i: msg.readFloat(),
			d: msg.readFloat(),
		};
		this.forceFactor = msg.readFloat();

		this.handles = [];
		this.motors = [];
		for(let i = 0; i < numMotors; i++)
			this.motors.push(new Motor(this, i));

		for(let i = 0; i < numHandles; i++) {
			const i3 = i * 3;
			const handle = new Handle(this, i, ...this.motors.slice(i3, i3 + 3));
			this.handles.push(handle);
			const name = msg.readByte();
			handle.name = HANDLE_NAMES[name] || `unknown: ${name}`;
			if(name)
				this[`${handle.name}Handle`] = handle;
			for(const motor of [handle.leftMotor, handle.rightMotor]) {
				motor.innerLength = msg.readFloat();
				motor.outerLength = msg.readFloat();
				motor.base = new Vector(msg.readFloat(), msg.readFloat());
				motor.minAngle = msg.readFloat();
				motor.maxAngle = msg.readFloat();
			}
		}

		for(const motor of this.motors)
			motor.steps = msg.readUInt16();

		this.protocol.send(start(DEFAULT_INTERVAL));
	},

	encoderValues(msg) {
		if(!this.configLoaded)
			return;

		const deltaTime = msg.readUInt32();
		for(const motor of this.motors)
			motor.steps = msg.readInt32();

		this.updateMotorPowers(deltaTime);
		this.protocol.send(setMotors(this.motors));
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
