'use strict';

const {Vector} = require('../geometry');

class ForceController {
	constructor(handle) {
		this.handle = handle;
		this.force = new Vector();
	}

	// eslint-disable-next-line class-methods-use-this
	end() {
		// no operation
	}

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
