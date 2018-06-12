'use strict';

const Vector = require('./vector');
const Line = require('./line');

const edgeIterator = function* (points) {
	const {length} = points;
	if(length < 2)
		return;

	let last = points[length - 1];
	for(const point of points) {
		yield new Line(last, point);
		last = point;
	}
};

/**
 * Class for defining polygons from a to b.
 * @property {Vector} points - the points of the polygon
 */
class Polygon {
	/**
	 * Create a Line object.
	 * @param {(Vector[]|Polygon)} [points=[]] - the points of the polygon or a polygon
	 */
	constructor(points = []) {
		if(typeof points === 'object')
			points = points.points === undefined ? [] : points.points;

		// create a frozen copy of the points
		if(!Object.isFrozen(points))
			points = Object.freeze([...points]);

		this.points = points;

		// make the segment immutable
		Object.freeze(this);
	}

	get edges() {
		return edgeIterator(this.points);
	}

	get outsideVector() {
		if(this.points.length === 0)
			return new Vector();

		let minX = Infinity;
		let minY = Infinity;
		for(const point of this.points) {
			if(minX > point.x)
				minX = point.x;
			if(minY > point.y)
				minY = point.y;
		}
		return new Vector(minX - 1, minY - 1);
	}

	contains(point) {
		/*
		 * ray-casting algorithm based on
		 * http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
		 */

		const {length} = this.points;
		if(length < 2)
			return false;

		const {x, y} = point;
		let inside = false;

		// the same iteration logic as in edgeIterator but without the creation of an Edge object
		let a = this.points[length - 1];
		for(const b of this.points) {
			if(((a.y > y) !== (b.y > y)) && (x < ((b.x - a.x) * (y - a.y) / (b.y - a.y)) + a.x))
				inside = !inside;
			a = b;
		}
		return inside;
	}

	nearestIntersection(point) {
		let shortestDist = Infinity;
		let nearestIntersection = null;

		for(const edge of this.edges) {
			// calculate the intersection and check if it is on the edge
			const intersection = edge.lineIntersection(Line.fromDirection(point, edge.perpendicular));
			if(edge.contains(intersection)) {
				const dist = intersection.diff(point).length;

				// check if it is the new nearest intersection
				if(shortestDist > dist) {
					shortestDist = dist;
					nearestIntersection = intersection;
				}
			}
		}

		return nearestIntersection;
	}

	map(callback) {
		const points = this.points.map(callback);
		Object.freeze(points);
		return new Polygon(points);
	}

	translate(vector) {
		return this.map(p => p.sum(vector));
	}
}

module.exports = Polygon;
