'use strict';

class Motor {
	constructor(device, index) {
		this.device = device;
		this.index = index;
		this.steps = 0;
		this.power = 0;
	}
}

module.exports = Motor;
