'use strict';

const {Vector} = require('../geometry');
const PID = require('../pid');

const PID_P = 16;

module.exports = {
	opMinDist: 15,
	opMaxDist: 120,
	opAngle: 0.4 * Math.PI,
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
				pid: new PID(PID_P, 0, 0.01),
			},
			right: {
				innerLength: 49,
				outerLength: 79,
				base: new Vector(30, 0),
				minAngle: -1,
				maxAngle: 1,
				stepsPerRevolution: 15360,
				initialAngle: -0.11 * Math.PI,
				pid: new PID(PID_P, 0, 0.01),
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
				pid: new PID(PID_P, 0, 0.01),
			},
			right: {
				innerLength: 66,
				outerLength: 79,
				base: new Vector(10, 0),
				minAngle: -1,
				maxAngle: 1,
				stepsPerRevolution: 15360,
				initialAngle: -0.06 * Math.PI,
				pid: new PID(PID_P, 0, 0.01),
			},
			handle: {
				stepsPerRevolution: 60,
				initialAngle: 0,
				pid: new PID(1, 0, 0.01),
			},
		},
	],
};
