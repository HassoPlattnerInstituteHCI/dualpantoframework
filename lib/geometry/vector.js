'use strict';

const {deprecated} = require('../util');

/* eslint-disable class-methods-use-this */

const immutabilityError = (oldName, newName, args = '') => new Error(`Vector is now immutable: \`vector.${oldName}(${args})\` can not be used anymore: use \`vector = vector.${newName}(${args})\` instead`);

const isBetween = (x, a, b) => (x >= a || x >= b) && (x <= a || x <= b);

/**
 * Class for defining Panto Vecotrs with x, y cords and r as roation.
 * @property {number} x - x coordinate
 * @property {number} y - y coordinate
 * @property {number} r - rotation in radian
 * @example <caption>Constructors:</caption>
 * const zeroVector    = new Vector(); // = new Vector(0, 0, 0)
 * const testVector    = new Vector(1, 2, 3);
 * const arrayVector   = new Vector([1, 2, 3]);
 * const copyVector    = new Vector(testVector);
 * const objectVector  = new Vector({x: 1, y: 2, r: 3});
 * @example <caption>Methods:</caption>
 * const a = new Vector(1, 2, 3);
 * const b = new Vector(4, 5, 6);
 * const c = a.dot(b);         // = 1*4 + 2*5 = 14
 * const d = a.determinant(b); // = 1*5 - 2*4 = -3
 * const e = a.scaled(2);      // = new Vector(2, 4, 6)
 * const f = a.sum(b);         // = new Vector(5, 7, 9)
 * const g = a.diff(b);        // = new Vector(-3, -3, -3)
 * const h = a.length;         // = Math.sqrt(1*1 + 2*2) = Math.sqrt(5)
 * const i = a.angle;          // = Math.atan2(2, 1)
 * const j = a.rotate(Math.PI);// = new Vector(-1, -2, 3) = "rotate 180 deg"
 * const k = a.normalized;     // = new Vector(0.45, 0,89, 3)
 * const l = a.product([
 *     0, -2,
 *     2, 0,
 * ]); // = new Vector(-4, 2, 3) = "rotate 90 deg and scale by 2"
 */
class Vector {
	/**
	 * Create a Vector object.
	 * @param {(number|number[]|Vector)} [x=0] - x coordinate or an array with [x, y, r] or a vector
	 * @param {number} [y=0] - y coordinate
	 * @param {number} [r=0] - rotation in radian
	 */
	constructor(x = 0, y = 0, r = 0) {
		if(Array.isArray(x)) {
			[x = 0, y = 0, r = 0] = x;
		} else if(typeof x === 'object') {
			r = x.r === undefined ? 0 : x.r;
			y = x.y === undefined ? 0 : x.y;
			x = x.x === undefined ? 0 : x.x;
		}

		this.x = x;
		this.y = y;
		this.r = r;

		// make the vector immutable
		Object.freeze(this);
	}

	static fromPolar(length, angle) {
		return new Vector(Math.cos(angle) * length, Math.sin(angle) * length);
	}

	inspect() {
		const N = 1;
		return `Vector(${this.x.toFixed(N)}, ${this.y.toFixed(N)}${this.r === 0 ? '' : `, ${this.r.toFixed(N)}`})`;
	}

	/**
	 * Calculates and returns the dot product with another vector.
	 * @param {Vector} other - the other vector
	 * @returns {number} The calculated result
	 */
	dot(other) {
		return (this.x * other.x) + (this.y * other.y);
	}

	/**
	 * Calculates and returns the determinant together with another vector.
	 * @param {Vector} other - the other vector
	 * @returns {number} The calculated result
	 */
	determinant(other) {
		return (this.x * other.y) - (this.x * other.y);
	}

	scale() {
		throw immutabilityError('scale', 'scaled', 'factor');
	}

	/**
	 * Creates a scaled vector.
	 * @param {number} factor - factor of scaling
	 * @returns {Vector} The scaled Vector
	 */
	scaled(factor) {
		return new Vector(
			this.x * factor,
			this.y * factor,
			this.r,
		);
	}

	add() {
		throw immutabilityError('add', 'sum', 'other');
	}

	/**
	 * Returns the sum of this vector and another vector.
	 * @param {Vector} other - the other vector
	 * @returns {Vector} The summed up vector
	 */
	sum(other) {
		return new Vector(
			this.x + other.x,
			this.y + other.y,
			this.r + other.r,
		);
	}

	subtract() {
		throw immutabilityError('subtract', 'diff', 'other');
	}

	difference(other) {
		deprecated('vector.difference(other)', 'vector.diff(other)');
		return this.diff(other);
	}

	/**
	 * Returns the difference of this vector and another vector.
	 * @param {Vector} other - the other vector
	 * @returns {Vector} The difference vector
	 */
	diff(other) {
		return new Vector(
			this.x - other.x,
			this.y - other.y,
			this.r - other.r,
		);
	}

	/**
	 * Calculates the length of the vector.
	 * This is a getter so just use `vector.length` instead of `vector.length()`.
	 * @type {number}
	 */
	get length() {
		return Math.sqrt(this.dot(this));
	}

	get perpendicular() {
		return new Vector(-this.y, this.x);
	}

	polarAngle() {
		deprecated('vector.polarAngle()', 'vector.angle');
		return this.angle;
	}

	/**
	 * Calculates the polar angle of the vector
	 * Right-hand coordinate system:
	 * Positive rotation => Counter Clock Wise
	 * Positive X-Axis is 0
	 * @type {number}
	 */
	get angle() {
		return Math.atan2(this.y, this.x);
	}

	/**
	 * Rotates the vector with the given angle
	 * Right-hand coordinate system:
	 * Positive rotation => Counter Clock Wise
	 * Positive X-Axis is 0
	 * @param {number} angle - angle in radians
	 * @returns {Vector} The rotated vector
	 */
	rotate(angle) {
		return this.product([
			Math.cos(angle), -Math.sin(angle),
			Math.sin(angle), Math.cos(angle),
		]);
	}

	isBetween(a, b) {
		return isBetween(this.x, a.x, b.x) && isBetween(this.y, a.y, b.y);
	}

	/**
	 * Returns the vector normalized (length = 1).
	 * @returns {Vector} The normalized vector
	 */
	normalized() {
		return this.scaled(1 / this.length);
	}

	/**
	 * Creates a transformed vector by multiplication with a matrix.
	 * @param {number[]} matrix - matrix to operate with
	 * @returns {Vector} The transfromed vector
	 */
	product(matrix) {
		return new Vector(
			(matrix[0] * this.x) + (matrix[1] * this.y),
			(matrix[2] * this.x) + (matrix[3] * this.y),
			this.r,
		);
	}
}

module.exports = Vector;
