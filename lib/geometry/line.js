'use strict';

const Vector = require('./vector');

// Zero vector (varable name is the caracter O, not zero :D)
const O = new Vector();

const EPSILON = 0.001;

/**
 * Class for defining lines from a to b.
 * Can be interpreted as a line or as a line segment.
 * @property {Vector} a - point a
 * @property {Vector} b - point b
 */
class Line {
	/**
	 * Create a Line object.
	 * @param {(Vector|Vector[]|Line)} [a=new Vector()] - point a or an array with [a, b] or a line
	 * @param {Vector} [b=new Vector()] - point b
	 */
	constructor(a = O, b = O) {
		if(Array.isArray(a)) {
			[a = O, b = O] = a;
		} else if(typeof a === 'object') {
			b = a.b === undefined ? O : a.b;
			a = a.a === undefined ? O : a.a;
		}

		this.a = a;
		this.b = b;

		// make the segment immutable
		Object.freeze(this);
	}

	static fromDirection(position, direction) {
		return new Line(position, position.sum(direction));
	}

	get vector() {
		return this.b.diff(this.a);
	}

	get determinant() {
		return this.a.determinant(this.b);
	}

	lineIntersection(other) {
		const thisVector = this.vector;
		const otherVector = other.vector;

		const determinant = thisVector.determinant(otherVector);
		if(Math.abs(determinant) < EPSILON)
			return null;

		const foo = otherVector.scaled(this.determinant / determinant);
		const bar = thisVector.scaled(other.determinant / determinant);

		return new Vector(foo.x - bar.x, bar.y - foo.y);
	}

	intersection(other) {
		const intersection = this.lineIntersection(other);
		if(this.contains(intersection) && other.contains(intersection))
			return intersection;
		return null;
	}

	contains(point) {
		return point.isBetween(this.a, this.b);
	}
}

module.exports = Line;
