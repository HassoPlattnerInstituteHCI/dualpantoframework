'use strict';

const TweenGenerator = require('../tween-generator');

/**
 * The position controller is used for position based rendering.
 * @prop {Handle} handle - the handle that uses this controller
 * @extends Controller
 * @private
 */
class PositionController {
	constructor(handle) {
		console.log('new PositionController', handle.name);
		this.handle = handle;
		this.movementID = 0;
		this.target = null;
	}

	/**
	 * Implement {@link Controller#end}.
	 * Stop current animations.
	 */
	end() {
		this.movementID++;
	}

	/**
	 * Implement {@link Controller#update}.
	 * Update the motor power values.
	 * @param {number} deltaTime - time since last update in microseconds
	 */
	update(deltaTime) {
		if(this.target === null) {
			this.handle.leftMotor.power = 0;
			this.handle.rightMotor.power = 0;
			return;
		}

		const [leftAngle, rightAngle] = this.handle.inverseKinematics(this.target);

		const leftDiff = this.handle.leftMotor.angle - leftAngle;
		const rightDiff = this.handle.rightMotor.angle - rightAngle;

		const leftPower = this.handle.leftMotor.pid.update(deltaTime, leftDiff);
		const rightPower = this.handle.rightMotor.pid.update(deltaTime, rightDiff);

		this.handle.leftMotor.power = leftPower;
		this.handle.rightMotor.power = rightPower;
	}

	/**
	 * Get the broker of the device the handle is part of.
	 * @type {Broker} the broker
	 */
	get broker() {
		return this.handle.device.broker;
	}

	/**
	 * Get the device that the handle is part of.
	 * @type {Device} the device
	 */
	get device() {
		return this.handle.device;
	}

	/**
	 * Move to a new position. (For internal use only)
	 * @param {Vector} position - the new position
	 */
	internalMoveTo(position) {
		this.target = position;
		this.device.emit('moveHandleTo', this.handle.index, position);
		if(this.device.isVirtual)
			this.handle.positionChanged(position);
	}

	/**
	 * Move to a new position. (Used by {@link Handle#moveTo})
	 * @param {Vector} target - the movement target
	 * @param {Object} [options={}] - movement options
	 * @param {number} [options.speed] - the movement speed (in units per millisecond) (overwrites duration)
	 * @param {number} [options.duration] - the movement duration (in milliseconds)
	 * @param {Object} [options.interpolationMethod] - the movement interpolation method
	 * @param {Vector} [options.position] - the start position of the movement
	 */
	async moveTo(target, options = {}) {
		const {
			speed = null,
			duration = null,
			interpolationMethod = this.broker.defaultInterpolationMethod,
			position = this.handle.position,
		} = options;

		if(!position) {
			console.error('device.movePantoTo: unable to execute movement, unknown last postion');
			return;
		}

		const movementID = ++this.movementID;

		const distance = target.difference(position).length;

		let calculatedDuration = null;
		if(speed) {
			// speed option
			calculatedDuration = distance / speed;
		} else if(duration) {
			// duration option
			calculatedDuration = duration;
		} else if(this.broker.defaultSpeed) {
			// speed default
			calculatedDuration = distance / this.broker.defaultSpeed;
		} else {
			// duration default
			calculatedDuration = this.broker.defaultDuration;
		}

		if(calculatedDuration < 1) {
			this.internalMoveTo(target);
			return;
		}

		const tweenGenerator = new TweenGenerator(
			position,
			target,
			calculatedDuration,
			interpolationMethod
		);
		for(const positionPromise of tweenGenerator) {
			const position = await positionPromise;
			if(this.movementID !== movementID)
				break;

			this.internalMoveTo(position);
		}
	}
}

module.exports = PositionController;
