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
				steps: 15360,
				pid: new PID(1, 0, 0.01),
			},
			right: {
				innerLength: 49,
				outerLength: 79,
				base: new Vector(30, 0),
				minAngle: -1,
				maxAngle: 1,
				steps: 15360,
				pid: new PID(1, 0, 0.01),
			},
			handle: {
				steps: 60,
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
				steps: 15360,
				pid: new PID(1, 0, 0.01),
			},
			right: {
				innerLength: 66,
				outerLength: 79,
				base: new Vector(10, 0),
				minAngle: -1,
				maxAngle: 1,
				steps: 15360,
				pid: new PID(1, 0, 0.01),
			},
			handle: {
				steps: 60,
				pid: new PID(1, 0, 0.01),
			},
		},
	],
};
