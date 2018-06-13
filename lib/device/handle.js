'use strict';

const EventEmitter = require('events');
const {Vector} = require('../geometry');
const {
	FreeController,
	PositionController,
	ForceController,
} = require('../controller');

const {deprecated} = require('../util');

const clamp = (x, a, b) => (x > b ? b : x < a ? a : x);
const INVERSE_ITERATIONS = 100;

class Handle extends EventEmitter {
	constructor(device, index, leftMotor, rightMotor, handleMotor) {
		super();
		this.device = device;
		this.index = index;
		this.leftMotor = leftMotor;
		this.rightMotor = rightMotor;
		this.handleMotor = handleMotor;
		this.position = new Vector();
		this.controller = new FreeController(this);
		this.obstacles = new Set();
	}

	setController(Controller) {
		if(!(this.controller instanceof Controller))
			this.controller = new Controller(this);
	}

	log(name, ...args) {
		console.log(`${this.name}.${name}(`, ...args, ')');
	}

	moveTo(position, options = {}) {
		this.setController(PositionController);
		this.controller.moveTo(position, options);
	}

	applyForce(force) {
		this.setController(ForceController);
		this.controller.force = force;
	}

	addObstacle(obstacle) {
		this.obstacles.add(obstacle);
	}

	setObstacles(obstacles) {
		this.obstacles = new Set(obstacles);
	}

	removeObstacle(obstacle) {
		this.obstacles.delete(obstacle);
	}

	unblock() {
		this.setController(FreeController);
	}

	positionChanged(position) {
		this.position = position;
		this.emit('positionChanged', position);
		if(this.device.emit('handleMoved', this.index, position))
			deprecated('device.on(\'handleMoved\', (index, position) => {...})', 'handle.on(\'positionChanged\', position => {...})');
	}

	/**
	 * Update the motor power values.
	 * @param {number} deltaTime - time in microseconds since last update
	 * @private
	 */
	updateMotorPowers(deltaTime) {
		if(!this.device.isVirtual)
			this.calculatePosition();

		this.controller.update(deltaTime);
	}

	calculatePosition() {
		const handlePosition = this.forwardKinematics();
		this.positionChanged(handlePosition);
	}

	/*
	 * ---------------- THIS PART WILL CHANGE IN THE FUTURE ----------------
	 * ----------------       Not for external use!         ----------------
	 */

	forwardKinematics() {
		const leftInnerPosition = this.leftMotor.innerLinkagePosition;
		const rightInnerPosition = this.rightMotor.innerLinkagePosition;

		// console.log('LEFT', this.leftMotor.base, leftInnerPosition, 'RIGHT', this.rightMotor.base, rightInnerPosition);

		const diagonal = rightInnerPosition.diff(leftInnerPosition);

		const leftOuterLength = this.leftMotor.outerLength;
		const rightOuterLength = this.rightMotor.outerLength;

		const leftInnerAngle = diagonal.angle - Math.acos(diagonal.length / (leftOuterLength + rightOuterLength));

		/*
		 * // not working for me :(
		 * const leftInnerAngle = diagonal.angle + Math.acos((
		 * 	diagonal.dot(diagonal) +
		 * 	(leftOuterLength * leftOuterLength) -
		 * 	(rightOuterLength * rightOuterLength)
		 * ) / (2 * diagonal.length * leftOuterLength));
		 */

		return leftInnerPosition.sum(Vector.fromPolar(leftOuterLength, leftInnerAngle));
	}

	inverseKinematicsHelper(inverted, diff, factor, threshold = 0.0001) {
		diff *= factor;

		if(Math.abs(diff) < threshold)
			return;

		this.leftMotor.angle += diff;
		this.rightMotor.angle += diff * inverted;
	}

	inverseKinematics(target) {
		const targetAngle = clamp(target.angle, -this.device.opAngle, this.device.opAngle);
		const targetRadius = clamp(target.length, this.device.opMinDist, this.device.opMaxDist);

		// console.log('TARGET', targetAngle, targetRadius);

		const savedAngles = [this.leftMotor.angle, this.rightMotor.angle];

		for(let i = 0; i < INVERSE_ITERATIONS; ++i) {
			const handlePosition = this.forwardKinematics();

			this.inverseKinematicsHelper(1, targetAngle - handlePosition.angle, 0.5);
			this.inverseKinematicsHelper(-1, targetRadius - handlePosition.length, 0.002);
		}

		const result = [this.leftMotor.angle, this.rightMotor.angle];
		[this.leftMotor.angle, this.rightMotor.angle] = savedAngles;

		return result;
	}

	calculateTransposedJacobianMatrix() {
		const leftInnerPosition = this.leftMotor.innerLinkagePosition;
		const rightInnerPosition = this.rightMotor.innerLinkagePosition;

		const diagonal = rightInnerPosition.diff(leftInnerPosition);

		const leftOuterLength = this.leftMotor.outerLength;
		const rightOuterLength = this.rightMotor.outerLength;

		const leftInnerAngle = diagonal.angle - Math.acos(diagonal.length / (leftOuterLength + rightOuterLength));
		const handlePosition = leftInnerPosition.sum(Vector.fromPolar(leftOuterLength, leftInnerAngle));
		const rightInnerAngle = handlePosition.diff(rightInnerPosition).angle;

		const leftInnerLength = this.leftMotor.innerLength;
		const rightInnerLength = this.rightMotor.innerLength;

		const leftMotorAngle = this.leftMotor.angle;
		const rightMotorAngle = this.rightMotor.angle;

		const sinInnerAngleDiff = Math.sin(leftInnerAngle - rightInnerAngle);

		const foo = leftInnerLength * Math.sin(rightInnerAngle - leftMotorAngle) / sinInnerAngleDiff;
		const bar = rightInnerLength * Math.sin(rightInnerAngle - rightMotorAngle) / sinInnerAngleDiff;

		const jacobian = [];

		jacobian[0] = -(leftInnerLength * Math.sin(leftMotorAngle)) - (Math.sin(leftInnerAngle) * foo);
		jacobian[1] = (leftInnerLength * Math.cos(leftMotorAngle)) + (Math.cos(leftInnerAngle) * foo);

		jacobian[2] = Math.sin(leftInnerAngle) * bar;
		jacobian[3] = -Math.cos(leftInnerAngle) * bar;

		return jacobian;
	}
}

module.exports = Handle;
