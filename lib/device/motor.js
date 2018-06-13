'use strict';

class Motor {
	constructor(device, index, data = {}) {
		this.device = device;
		this.index = index;
		this.steps = 0;
		this.power = 0;

		Object.assign(this, data);
	}
}

module.exports = Motor;
