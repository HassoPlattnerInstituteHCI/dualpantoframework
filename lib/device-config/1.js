'use strict';

const {Vector} = require('../geometry');
const PID = require('../pid');

module.exports = {
	minDist: -15,
	forceFactor: 0.01,
	handles: [
		{
			name: 'meHandle',
			left: {
				innerLength: 66,
				outerLength: 79,
				base: new Vector(-10, 0),
				minAngle: -1,
				maxAngle: 1,
				stepsPerRevolution: 15360,
				initialAngle: -0.96 * Math.PI,
				pid: new PID(1, 0, 0.01),
			},
			right: {
				innerLength: 49,
				outerLength: 79,
				base: new Vector(30, 0),
				minAngle: -1,
				maxAngle: 1,
				stepsPerRevolution: 15360,
				initialAngle: -0.11 * Math.PI,
				pid: new PID(1, 0, 0.01),
			},
			handle: {
				stepsPerRevolution: 60,
				initialAngle: 0,
				pid: new PID(1, 0, 0.01),
			},
		},
		{
			name: 'itHandle',
			left: {
				innerLength: 49,
				outerLength: 79,
				base: new Vector(-30, 0),
				minAngle: -1,
				maxAngle: 1,
				stepsPerRevolution: 15360,
				initialAngle: -0.91 * Math.PI,
				pid: new PID(1, 0, 0.01),
			},
			right: {
				innerLength: 66,
				outerLength: 79,
				base: new Vector(10, 0),
				minAngle: -1,
				maxAngle: 1,
				stepsPerRevolution: 15360,
				initialAngle: -0.06 * Math.PI,
				pid: new PID(1, 0, 0.01),
			},
			handle: {
				stepsPerRevolution: 60,
				initialAngle: 0,
				pid: new PID(1, 0, 0.01),
			},
		},
	],
};
