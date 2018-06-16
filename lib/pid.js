'use strict';

/**
 * A PID controller class.
 * @prop {number} p the p value
 * @prop {number} i the i value
 * @prop {number} d the d value
 * @prop {number} integral the current integral of the error
 * @prop {number} lastError the last error
 * @param {number} [p=1] the p value
 * @param {number} [i=0] the i value
 * @param {number} [d=0] the d value
 * @private
 */
class PID {
	constructor(p = 1, i = 0, d = 0) {
		this.p = p;
		this.i = i;
		this.d = d;
		this.integral = 0;
		this.lastError = 0;
	}

	/**
	 * Implement a nice debug string representation for `console.log(pid)`.
	 * @returns {string} the debug string representation
	 * @private
	 */
	inspect() {
		return `PID(${this.p}, ${this.i}, ${this.d})`;
	}

	/**
	 * Calculate a new value for a given error using the pid controller.
	 * @param {number} deltaTime the time in microseconds since the last update
	 * @param {number} error the error for the pid controller
	 * @returns {number} the calculated value (in the range of [-1, 1])
	 */
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
