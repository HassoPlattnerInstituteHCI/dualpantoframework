'use strict';

const {Vector} = require('../geometry');

const PI2 = Math.PI * 2;
const RAD_TO_DEG = 360 / PI2;

class Motor {
	constructor(device, index, data = {}) {
		this.device = device;
		this.index = index;
		this.steps = 0;
		this.power = 0;

		Object.assign(this, data);
		this.stepsToAngleFactor = PI2 / this.stepsPerRevolution;
	}

	set steps(steps) {
		this.angle = (steps * this.stepsToAngleFactor) + this.initialAngle;
	}

	get angleDeg() {
		return this.angle * RAD_TO_DEG;
	}

	get innerLinkagePosition() {
		return this.base.sum(Vector.fromPolar(this.innerLength, this.angle));
	}
}

module.exports = Motor;
