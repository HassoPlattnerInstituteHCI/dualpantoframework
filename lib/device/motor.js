'use strict';

const {Vector} = require('../geometry');

const PI2 = Math.PI * 2;
const RAD_TO_DEG = 360 / PI2;

/**
 * A Motor of a dual panto. All motor configuration values from the device
 * configuration are directly available on the motor.
 * @prop {Device} device the device the motor is part of
 * @prop {number} index the motor index
 * @prop {Object} data the motor data
 * @prop {number} angle the current motor angle
 * @prop {number} power the current motor power
 * @param {Device} device the device the motor is part of
 * @param {number} index the motor index
 * @param {Object} [data={}] the motor data
 * @private
 */
class Motor {
	constructor(device, index, data = {}) {
		this.device = device;
		this.index = index;
		this.steps = 0;
		this.power = 0;

		Object.assign(this, data);
		this.stepsToAngleFactor = PI2 / this.stepsPerRevolution;
	}

	/**
	 * Motor steps are stored by converting them into the angle.
	 * @type {number}
	 */
	get steps() {
		return (this.angle - this.initialAngle) / this.stepsToAngleFactor;
	}

	set steps(steps) {
		this.angle = (steps * this.stepsToAngleFactor) + this.initialAngle;
	}

	/**
	 * Convert the motor angle into degree.
	 * @type {number}
	 */
	get angleDeg() {
		return this.angle * RAD_TO_DEG;
	}

	/**
	 * Calculate the position of the inner linkage.
	 * @type {Vector}.
	 */
	get innerLinkagePosition() {
		return this.base.sum(Vector.fromPolar(this.innerLength, this.angle));
	}
}

module.exports = Motor;
