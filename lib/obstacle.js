'use strict';

const {Vector} = require('./geometry');

/* eslint-disable class-methods-use-this */
class Obstacle {
	constructor(pointArray) {
		this.pointArray = pointArray;
	}

	intersect2d(p1a, p1b, p2a, p2b, linintersection = false) {
		const lineA = p1b.difference(p1a);
		const lineB = p2b.difference(p2a);
		const determinante = (lineA.x * lineB.y) - (lineB.x * lineA.y);
		if(Math.abs(determinante) < 0.001)
			return null;

		const detBA0 = lineB.x * p1a.y;
		const detBA1 = lineB.y * p1a.x;
		const detBB0 = lineB.x * p2a.y;
		const detBB1 = lineB.y * p2a.x;
		const t = (((detBA0 - detBA1) - detBB0) + detBB1) / determinante;
		if(!linintersection && (t > 1 || t < 0))
			return null;

		return p1a.sum(lineA.scale(t));
	}

	inside(point) {
		/*
		 * ray-casting algorithm based on
		 * http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
		 */
		const {x, y} = point;
		let inside = false;
		for(let i = 0, j = this.pointArray.length - 1; i < this.pointArray.length; j = i++) {
			const {xi, yi} = this.pointArray[i];
			const {xj, yj} = this.pointArray[j];
			const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi) / (yj - yi)) + xi);
			if(intersect)
				inside = !inside;
		}
		return [inside, this];
	}

	getCollisionEdge(positionHandle, positionObject) {
		let smallestDistance = NaN;
		let edge = null;
		for(let i = 0, j = this.pointArray.length - 1; i < this.pointArray.length; j = i++) {
			const pointA = this.pointArray[i];
			const pointB = this.pointArray[j];
			const intersectionPoint = this.intersect2d(positionObject, positionHandle, pointA, pointB);
			if(intersectionPoint === null)
				continue;

			const difference = intersectionPoint.difference(positionObject);
			if(isNaN(smallestDistance) || difference.length() < smallestDistance) {
				smallestDistance = difference.length();
				edge = [pointA, pointB];
			}
		}
		return edge;
	}

	getClosestOutsidePoint(edge, positionHandle) {
		const lineDirection = edge[0].difference(edge[1]);
		const perpendicularVector = new Vector(-lineDirection.y, lineDirection.x);
		let outsidePoint = this.intersect2d(edge[0], edge[1], positionHandle, positionHandle.sum(perpendicularVector), true);
		const collisionVec = outsidePoint.difference(positionHandle);
		outsidePoint = positionHandle.sum(collisionVec.scale(1.1));
		return outsidePoint;
	}
}
<<<<<<< HEAD

=======
>>>>>>> develop
module.exports = Obstacle;
