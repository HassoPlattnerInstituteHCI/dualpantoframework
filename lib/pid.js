'use strict';

class PID {
	constructor(p = 1, i = 0, d = 0) {
		this.p = p;
		this.i = i;
		this.d = d;
	}

	inspect() {
		return `PID(${this.p}, ${this.i}, ${this.d})`;
	}
}

module.exports = PID;
