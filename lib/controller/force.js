'use strict';

const {Vector} = require('../geometry');

/**
 * The force controller is used for force rendering.
 * @extends Controller
 * @prop {Handle} handle the handle that uses this controller
 * @prop {Vector} force the current force vector
 * @param {Handle} handle the handle that uses this controller
 * @private
 */
class ForceController {
	constructor(handle) {
		this.handle = handle;
		this.force = new Vector();
	}

	/**
	 * Implement {@link Controller#end}. (Not used)
	 */
	// eslint-disable-next-line class-methods-use-this
	end() {
		// no operation
	}

	/**
	 * Implement {@link Controller#update}.
	 * Update the motor power values.
	 */
	update() {
		if(this.force.length > 0) {
			const jacobian = this.handle.calculateTransposedJacobianMatrix();
			const torque = this.force.product(jacobian).scaled(this.handle.device.forceFactor);
			this.handle.leftMotor.power = -torque.x;
			this.handle.rightMotor.power = -torque.y;
		} else {
			this.handle.leftMotor.power = 0;
			this.handle.rightMotor.power = 0;
		}
	}
}

module.exports = ForceController;
