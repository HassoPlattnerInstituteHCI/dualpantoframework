'use strict';

class FreeController {
	constructor(handle) {
		this.handle = handle;
	}

	// eslint-disable-next-line class-methods-use-this
	end() {
		// no operation
	}

	update(deltaTime) {
		const {position} = this.handle;
		let target = position;
		for(const obstacle of this.handle.obstacles) {
			if(obstacle.contains(target)) {
				const newTarget = obstacle.nearestIntersection(target);
				if(!newTarget) {
					console.warn('polygon contains a point but is unable to find the nearest intersection');
					continue;
				}

				target = newTarget;
			}
		}

		this.handle.handleMotor.power = 0;

		if(target === position) {
			this.handle.leftMotor.power = 0;
			this.handle.rightMotor.power = 0;
			return;
		}

		const [leftAngle, rightAngle] = this.handle.inverseKinematics(target);

		const leftDiff = this.handle.leftMotor.angle - leftAngle;
		const rightDiff = this.handle.rightMotor.angle - rightAngle;

		const leftPower = this.handle.leftMotor.pid.update(deltaTime, leftDiff);
		const rightPower = this.handle.rightMotor.pid.update(deltaTime, rightDiff);

		this.handle.leftMotor.power = leftPower;
		this.handle.rightMotor.power = rightPower;
	}
}

module.exports = FreeController;
