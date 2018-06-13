'use strict';

const TweenGenerator = require('../tween-generator');

class PositionController {
	constructor(handle) {
		console.log('new PositionController', handle.name);
		this.handle = handle;
		this.movementID = 0;
		this.target = handle.position;
	}

	end() {
		this.movementID++;
	}

	update(deltaTime) {
		const [leftAngle, rightAngle] = this.handle.inverseKinematics(this.target);

		const leftDiff = this.handle.leftMotor.angle - leftAngle;
		const rightDiff = this.handle.rightMotor.angle - rightAngle;

		const leftPower = this.handle.leftMotor.pid.update(deltaTime, leftDiff);
		const rightPower = this.handle.rightMotor.pid.update(deltaTime, rightDiff);

		this.handle.leftMotor.power = leftPower;
		this.handle.rightMotor.power = rightPower;
	}

	get broker() {
		return this.handle.device.broker;
	}

	get device() {
		return this.handle.device;
	}

	internalMoveTo(position) {
		this.target = position;
		this.device.emit('moveHandleTo', this.handle.index, position);
		if(this.device.isVirtual)
			this.handle.positionChanged(position);
	}

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

		const distance1000 = target.difference(position).length * 1000;

		let calculatedDuration = null;
		if(speed) {
			// speed option
			calculatedDuration = distance1000 / speed;
		} else if(duration) {
			// duration option
			calculatedDuration = duration;
		} else if(this.broker.defaultSpeed) {
			// speed default
			calculatedDuration = distance1000 / this.broker.defaultSpeed;
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
