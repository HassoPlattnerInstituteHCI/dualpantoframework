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

/**
 * A single handle of a dual panto.
 * @property {Device} device the device the handle is part of
 * @property {number} index the index number of the handle
 * @property {Motor} leftMotor the left motor
 * @property {Motor} rightMotor the right motor
 * @property {Motor} handleMotor the handle motor
 * @property {Vector} position the current position
 * @property {Controller} controller the current movement controller
 * @property {Set<Polygon>} obstacles the current obstacles
 * @param {Device} device the device the handle is part of
 * @param {number} index the index number of the handle
 * @param {Motor} leftMotor the left motor
 * @param {Motor} rightMotor the right motor
 * @param {Motor} handleMotor the handle motor
 */
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

	/**
	 * Ensure that the controller property is an instance of a given class.
	 * @param {class<Controller>} Controller the new controller class
	 * @private
	 */
	setController(Controller) {
		if(!(this.controller instanceof Controller))
			this.controller = new Controller(this);
	}

	/**
	 * Move the handle to a new position.
	 * Calls {@link PositionController#moveTo}.
	 * @param {Vector} position the position the handle should move to
	 * @param {Object} [options={}] the movement options
	 * @param {number} [options.speed] the movement speed (in units per millisecond) (overwrites duration)
	 * @param {number} [options.duration] the movement duration (in milliseconds)
	 * @param {Object} [options.interpolationMethod] the movement interpolation method
	 * @param {Vector} [options.position] the start position of the movement
	 */
	moveTo(position, options = {}) {
		this.setController(PositionController);
		this.controller.moveTo(position, options);
	}

	/**
	 * Apply a force to the handle.
	 * @param {Vector} force the force that should be apply
	 */
	applyForce(force) {
		this.setController(ForceController);
		this.controller.force = force;
	}

	/**
	 * Add an obstacle to the list of current obstacles.
	 * @param {Polygon} obstacle the new obstacle
	 */
	addObstacle(obstacle) {
		this.obstacles.add(obstacle);
	}

	/**
	 * Set a new list of current obstacles.
	 * @param {Polygon[]} obstacles the new obstacles
	 */
	setObstacles(obstacles) {
		this.obstacles = new Set(obstacles);
	}

	/**
	 * Remove an obstacle from the list of current obstacles.
	 * @param {Polygon} obstacle the obstacle to remove
	 */
	removeObstacle(obstacle) {
		this.obstacles.delete(obstacle);
	}

	/**
	 * Unblock the handle. (i.e. allow free movement)
	 */
	unblock() {
		this.setController(FreeController);
	}

	/**
	 * Called when the position of the handle has changed.
	 * @param {Vector} position the new position
	 * @private
	 */
	positionChanged(position) {
		this.position = position;

		/**
		 * The position of the handle has changed.
		 * @memberof Handle
		 * @event Handle#positionChanged
		 * @param {Vector} position the new position
		 */
		this.emit('positionChanged', position);

		/**
		 * The position of a handle has changed.
		 * @deprecated __Use `handle.on('positionChanged', ...)` instead!__
		 * @memberof Device
		 * @event Device#handleMoved
		 * @param {number} index index of the handle
		 * @param {Vector} position the new position
		 */
		if(this.device.emit('handleMoved', this.index, position))
			deprecated('device.on(\'handleMoved\', (index, position) => {...})', 'handle.on(\'positionChanged\', position => {...})');
	}

	/**
	 * Update the motor power values.
	 * @param {number} deltaTime time in microseconds since last update
	 * @private
	 */
	updateMotorPowers(deltaTime) {
		if(!this.device.isVirtual)
			this.calculatePosition();

		this.controller.update(deltaTime);
	}

	/**
	 * Calculate the new handle position.
	 * @private
	 */
	calculatePosition() {
		const handlePosition = this.forwardKinematics();
		this.positionChanged(handlePosition);
	}

	/*
	 * ---------------- THIS PART WILL CHANGE IN THE FUTURE ----------------
	 * ----------------       Not for external use!         ----------------
	 */

	/**
	 * Convert the motor positions into the handle position.
	 * @returns {Vector} the handle position
	 * @private
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

	/**
	 * Update the virtual motor angles according to the current error.
	 * @param {number} inverted invert the right motor (value should be 1 or -1)
	 * @param {number} diff the current difference
	 * @param {number} factor a multiplication factor for the diff
	 * @param {number} [threshold=0.0001] an rounding threshold
	 * @private
	 */
	inverseKinematicsHelper(inverted, diff, factor, threshold = 0.0001) {
		diff *= factor;

		if(Math.abs(diff) < threshold)
			return;

		this.leftMotor.angle += diff;
		this.rightMotor.angle += diff * inverted;
	}

	/**
	 * Convert a handle position into motor angles.
	 * @param {Vector} target the target position
	 * @returns {number[]} the left and right motor angle
	 * @private
	 */
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

	/**
	 * Calcualte the transposed jacobian matrix.
	 * @returns {number[]} the matrix as an array [a, b, c, d]
	 * @private
	 */
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
