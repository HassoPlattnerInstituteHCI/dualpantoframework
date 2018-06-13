'use strict';

class FreeController {
	constructor(handle) {
		this.handle = handle;
	}

	// eslint-disable-next-line class-methods-use-this
	end() {
		// no operation
	}

	update() {
		this.handle.leftMotor.power = 0;
		this.handle.rightMotor.power = 0;
		this.handle.handleMotor.power = 0;
	}
}

module.exports = FreeController;
