'use strict';

const EventEmitter = require('events');
const Vector = require('../Vector.js');

// const TweenGenerator = require('./tween-generator');

// const CONTROL_METHOD_POSITION = 0;

// const CONTROL_METHOD_FORCE = 1;

// const NAN_VECTOR = new Vector(NaN, NaN, NaN);

// const bufferToArrayBuffer = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

class Handle extends EventEmitter {
	constructor(device, index, leftMotor, rightMotor, handleMotor) {
		super();
		this.device = device;
		this.index = index;
		this.leftMotor = leftMotor;
		this.rightMotor = rightMotor;
		this.handleMotor = handleMotor;
		this.position = new Vector();
	}

	log(name, ...args) {
		console.log(`${this.name}Handle.${name}(`, ...args, ')');
	}

	moveTo(position, options = {}) {
		this.log('moveTo', position, options);
	}

	unblock() {
		this.log('unblock');
	}

	/**
	 * Update the motor power values.
	 * @param {number} deltaTime - time in microseconds since last update
	 * @private
	 */
	updateMotorPowers() {
		if(this.index !== 1)
			return;

		const [other] = this.device.handles;

		const master = 0;
		if(this.index === master) {
			other.leftMotor.power = other.leftMotor.steps - this.leftMotor.steps;
			other.rightMotor.power = other.rightMotor.steps - this.rightMotor.steps;
		} else {
			this.leftMotor.power = this.leftMotor.steps - other.leftMotor.steps;
			this.rightMotor.power = this.rightMotor.steps - other.rightMotor.steps;
		}

		this.handleMotor.power = this.handleMotor.steps - (other.handleMotor.steps * 4);
	}
}

module.exports = Handle;
