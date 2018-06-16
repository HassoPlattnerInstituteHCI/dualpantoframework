'use strict';

const Vector = require('./vector');

// Zero vector (varable name is the caracter O, not zero :D)
const O = new Vector();

const EPSILON = 0.001;

/**
 * Class for defining lines from a to b.
 * Can be interpreted as a line or as a line segment.
 * @prop {Vector} a point a
 * @prop {Vector} b point b
 * @param {(Vector|Vector[]|Line)} [a=new Vector()] point a or an array with [a, b] or a line
 * @param {Vector} [b=new Vector()] point b
 */
class Line {
	constructor(a = O, b = O) {
		if(Array.isArray(a)) {
			[a = O, b = O] = a;
		} else if(!Vector.isVector(a)) {
			b = a.b === undefined ? O : a.b;
			a = a.a === undefined ? O : a.a;
		}

		this.a = a;
		this.b = b;

		// make the line immutable
		Object.freeze(this);
	}

	/**
	 * Create a line from a position and direction vector.
	 * @param {Vector} position the position vector
	 * @param {Vector} direction the direction vector
	 * @returns {Line} the new line
	 * @example
	 * Line.fromDirection(pos, dir) === new Line(pos, pos.sum(dir))
	 */
	static fromDirection(position, direction) {
		return new Line(position, position.sum(direction));
	}

	/**
	 * Get a vector from a to b.
	 * @type {Vector}
	 */
	get vector() {
		return this.b.diff(this.a);
	}

	/**
	 * Get the determinant of a and b.
	 * @type {number}
	 */
	get determinant() {
		return this.a.determinant(this.b);
	}

	/**
	 * Calcualte the intersection of this line and another line.
	 * @param {Line} other the other line
	 * @returns {Vector?} the intersection point or null
	 */
	lineIntersection(other) {
		const thisVector = this.vector;
		const otherVector = other.vector;

		const determinant = thisVector.determinant(otherVector);
		if(Math.abs(determinant) < EPSILON)
			return null;

		const foo = otherVector.scaled(this.determinant / determinant);
		const bar = thisVector.scaled(other.determinant / determinant);

		return new Vector(bar.x - foo.x, bar.y - foo.y);
	}

	/**
	 * Calcualte the intersection of this line segment and another line segment.
	 * This is like {@link Line#lineIntersection} but checks whether
	 * the intersection is between a and b of this and the other line.
	 * @param {Line} other the other line
	 * @returns {Vector?} the intersection point or null
	 */
	intersection(other) {
		const intersection = this.lineIntersection(other);
		if(this.contains(intersection) && other.contains(intersection))
			return intersection;
		return null;
	}

	/**
	 * Checks if a point is between a and b. The point does not have to be on
	 * the line, just in the rectangle between a and b.
	 * @param {Vector} point the point
	 * @returns {boolean} whether the point is between a and b
	 */
	contains(point) {
		return point.isBetween(this.a, this.b);
	}
}

module.exports = Line;
