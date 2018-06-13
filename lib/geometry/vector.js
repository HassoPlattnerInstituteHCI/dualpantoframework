'use strict';

const {deprecated} = require('../util');

/* eslint-disable class-methods-use-this */

const immutabilityError = (oldName, newName, args = '') => new Error(`Vector is now immutable: \`vector.${oldName}(${args})\` can not be used anymore: use \`vector = vector.${newName}(${args})\` instead`);

/**
 * Class for Class for defining Panto Vecotrs with x, y cords and r as roation.
 * @property {number} x - x coordinate
 * @property {number} y - y coordinate
 * @property {number} r - rotation in radian
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

	/**
	 * Calculates and returns the dot product with another vector.
	 * @param {Vector} other - the other vector
	 * @returns {number} The calculated result
	 */
	dot(other) {
		return (this.x * other.x) + (this.y * other.y);
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
