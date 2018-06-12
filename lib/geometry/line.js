'use strict';

/**
 * Class for Class for defining Lines.
 * A line is stored as a vector equation.
 * @property {Vector} a - a startiong point
 * @property {number} b - b factor
 * @property {number} c - c value
 */
class Line {
	/**
	 * Create a Line object.
	 * @param {(number|number[]|Line)} a - a factor or an array with [a, b, c] or a line
	 * @param {number} b - b factor
	 * @param {number} c - c value
	 */
	constructor(a = 0, b = 0, c = 0) {
		if(Array.isArray(a)) {
			[a = 0, b = 0, c = 0] = a;
		} else if(typeof a === 'object') {
			c = a.c === undefined ? 0 : a.c;
			b = a.b === undefined ? 0 : a.b;
			a = a.a === undefined ? 0 : a.a;
		}

		this.a = a;
		this.b = b;
		this.c = c;

		// make the line immutable
		Object.freeze(this);
	}
}

module.exports = Line;
