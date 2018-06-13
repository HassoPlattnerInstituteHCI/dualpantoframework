'use strict';

class PID {
	constructor(p = 1, i = 0, d = 0) {
		this.p = p;
		this.i = i;
		this.d = d;
		this.integral = 0;
		this.lastError = 0;
	}

	inspect() {
		return `PID(${this.p}, ${this.i}, ${this.d})`;
	}

	update(deltaTime, error) {
		const derivative = (error - this.lastError) / deltaTime;
		const integral = this.integral += error * deltaTime;

		const value = (error * this.p) + (integral * this.i) + (derivative * this.d);

		this.lastError = error;
		if(value > 1)
			return 1;
		if(value < -1)
			return -1;
		return value;
	}
}

module.exports = PID;
