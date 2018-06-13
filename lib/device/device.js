'use strict';

const EventEmitter = require('events');
const {keywordEvent} = require('../voice-interaction');
const {Protocol} = require('../protocol');
const {loadConfig} = require('../device-config');
const {handleCommands, startCommand} = require('./commands');
const Motor = require('./motor');
const Handle = require('./handle');
const MoveableObject = require('../moveable-object');
const Obstacle = require('../obstacle');
const {deprecated} = require('../util');

const DEFAULT_INTERVAL = 300;

/* eslint-disable no-unused-vars */
const bigPantoForceScale = 0.1125;
const smallPantoForceScale = 0.125;
/* eslint-enable no-unused-vars */

/**
 * Device represents a physical or virtual dual panto device.
 * A device is created by a broker when a physical device is connected
 * or when the visual debugger needs a virtual device.
 * @extends EventEmitter
 */
class Device extends EventEmitter {
	/*
	 ****************************************************************
	 * --> broker related methods
	 ****************************************************************
	 */

	/**
	 * Creates a new device. Normally called by the {@see Broker}.
	 * @param {Broker} broker - the broker the device is created by
	 * @param {string} port - port on that the device is connected (or 'virtual<n>')
	 * @param {boolean} [isVirtual=false] - is this a virtual device
	 */
	constructor(broker, port, isVirtual = false) {
		super();
		this.broker = broker;
		this.port = port;
		this.isVirtual = isVirtual;

		this.protocol = isVirtual ? null : new Protocol(this, this.port);
		if(isVirtual)
			console.log('@TODO: implement virtual config');
		else
			handleCommands(this, this.protocol);

		broker.addDevice(this);

		this.me = new MoveableObject();
		this.it = new MoveableObject();
	}

	/**
	 * Disconnect the device.
	 * @private
	 */
	disconnect() {
		this.broker.removeDevice(this);
		this.emit('disconnect');
	}

	/**
	 * Initialize the device by loading a device configuration.
	 * @param  {number} configurationID - the device configuration id
	 * @param {numbers[]} maxPowers - the maximum motor powers
	 * @private
	 */
	async loadConfig(configurationID, maxPowers = []) {
		const configOrUndefined = await loadConfig(configurationID);
		if(!configOrUndefined)
			throw new Error('device: unknwon configurationID:', configurationID);

		const {handles, ...config} = configOrUndefined;

		Object.apply(this, config);

		this.motors = [];
		this.handles = [];

		let motorIndex = 0;
		let handleIndex = 0;
		for(const {name, left, right, handle} of handles) {
			const leftMotor = new Motor(this, motorIndex++, left);
			const rightMotor = new Motor(this, motorIndex++, right);
			const handleMotor = new Motor(this, motorIndex++, handle);
			this.motors.push(leftMotor, rightMotor, handleMotor);
			this.handles.push(this[name] = new Handle(this, handleIndex++, leftMotor, rightMotor, handleMotor));
		}

		if(maxPowers.length !== this.motors.length)
			console.warn(`device: ${this.motors.length} motors in config but ${maxPowers.length} motors in firmware`);

		for(let i = 0; i < motorIndex; i++)
			this.motors[i].maxPower = i < maxPowers.length ? maxPowers[i] : this.pwmMax;

		console.log(this);

		if(!this.isVirtual)
			this.protocol.send(startCommand(DEFAULT_INTERVAL));
	}

	/**
	 * Update the motor power values.
	 * @param {number} deltaTime - time in microseconds since last update
	 * @private
	 */
	updateMotorPowers(deltaTime) {
		for(const handle of this.handles)
			handle.updateMotorPowers(deltaTime);
	}

	/*
	 ****************************************************************
	 * --> movement related methods (all of them are deprecated :D)
	 ****************************************************************
	 */

	/**
	 * gets the last known position of the me handle
	 * @returns {Vector} last known position as vector
	 */
	getMePosition() {
		deprecated('device.getMePosition()', 'device.meHandle.position');
		return this.meHandle.position;
	}

	/**
	 * gets the last known position of the it handle
	 * @returns {Vector} last known position as vector
	 */
	getItPosition() {
		deprecated('device.getItPosition()', 'device.itHandle.position');
		return this.itHandle.position;
	}

	/**
	 * Sets new positions if handles are moved by ViDeb.
	 * @param {number} index - index of moved handle
	 * @param {Vector} position - position the handle was moved to
	 * @private
	 */
	// @TODO replace with device.emit('handleMoved', index, position) in ViDeb
	handleMoved(index, position) {
		deprecated('device.handleMoved(index, position)', "device.emit('handleMoved', index, position)");
		console.log('device.handleMoved(', index, position, ')');
		this.handles[index].position = position;
		this.emit('handleMoved', index, position);
	}

	/**
	 * Creates obstacles for handles
	 * @param {array} pointArray - array containing edge points of the obstacle
	 * @param {number} [index=-1] - index of affected handle with -1 meaning both
	 * @returns {Obstacle} the created obstacle
	 */
	createObstacle(pointArray, index = -1) {
		const obstacle = new Obstacle(pointArray);
		if(index === -1) {
			this.me.addObstacle(obstacle);
			this.it.addObstacle(obstacle);
		} else if(index === 0) {
			this.me.addObstacle(obstacle);
		} else if(index === 1) {
			this.it.addObstacle(obstacle);
		}
		return obstacle;
	}

	/**
	 * Remove obstacles for handles
	 * @param {array} obstacle - the obstacle to be removed
	 * @param {number} [index=-1] - index of affected handle with -1 meaning both
	 */
	removeObstacle(obstacle, index = -1) {
		if(index === -1) {
			this.me.removeObstacle(obstacle);
			this.it.removeObstacle(obstacle);
		} else if(index === 0) {
			this.me.removeObstacle(obstacle);
		} else if(index === 1) {
			this.it.removeObstacle(obstacle);
		}
	}

	/**
	 * Moves a handle to a position.
	 * @deprecated **Use {@link Handle#moveTo} instead!**
	 * @param {number} index - index of handle to move
	 * @param {Vector} target - position the handle should move to
	 * @example
	 * // deprecated:
	 * device.moveHandleTo(0, new Vector(35, -50, 0));
	 * // new style:
	 * // pass 0 as the second argument to disable the animation
	 * device.meHandle.moveTo(new Vector(35, -50, 0), 0);
	 */
	moveHandleTo(index, target) {
		deprecated('device.moveHandleTo(index, target)', 'handle.setPosition(target)');
		console.log('@TODO:', `this.emit('moveHandleTo', ${index}, ${target});`);
		this.handles[index].setPosition(target);
	}

	/**
	 * Applies force vector to the pantograph.
	 * @deprecated **Use {@link Handle#applyForce} instead!**
	 * @param {number} index - index of handle to apply force
	 * @param {Vector} force - vector of force to render (r component is ignored)
	 * @example
	 * // deprecated:
	 * device.applyForceTo(0, new Vector(5, 7));
	 * // new style:
	 * device.meHandle.applyForce(new Vector(5, 7));
	 */
	applyForceTo(index, force) {
		deprecated('device.applyForceTo(index, force)', 'handle.applyForce(force)');
		this.handles[index].applyForce(force);
	}

	/**
	 * Moves a handle with tween movement behaviour.
	 * @deprecated **Use {@link Handle#moveTo} instead!**
	 * @param {number} index - index of handle to move
	 * @param {Vector} target - position the handle should move to
	 * @param {Object} [options] - movement options
	 * @example Deprecated
	 * await device.movePantoTo(1, new Vector(24, -38, Math.PI/2));
	 *
	 * // slow movement (1 second = 1000 milliseconds)
	 * await device.movePantoTo(1, new Vector(24, -38, Math.PI/2), {duration: 1000});
	 *
	 * // fast movement, with speed (100 = a distance of 50 should take 0.5 sec)
	 * await device.movePantoTo(1, new Vector(-25, -38, Math.PI/2), {speed: 100});
	 * @example New Style
	 * await device.itHandle.moveTo(new Vector(24, -38, Math.PI/2));
	 *
	 * // slow movement (1 second = 1000 milliseconds)
	 * await device.itHandle.moveTo(new Vector(24, -38, Math.PI/2), {duration: 1000});
	 *
	 * // fast movement, with speed (100 = a distance of 50 should take 0.5 sec)
	 * await device.itHandle.moveTo(new Vector(-25, -38, Math.PI/2), {speed: 100});
	 */
	async movePantoTo(index, target, options) {
		deprecated('device.movePantoTo(index, target, options)', 'handle.moveTo(target, options)');
		await this.handles[index].moveTo(target, options);
	}

	/**
	 * Unblocks a handle. This enables free movement.
	 * @deprecated **Use {@link Handle#unblock} instead!**
	 * @param {number} index - index of handle to unblock
	 * @example
	 * // deprecated:
	 * device.unblockHandle(0);
	 * // new style:
	 * device.meHandle.unblock();
	 */
	unblockHandle(index) {
		deprecated('device.unblockHandle(index)', 'handle.unblock()');
		this.handles[index].unblock();
	}

	/**
	 * Unblocks a handle.
	 * @deprecated **Use {@link Device#unblockHandle} instead!**
	 * @param {number} index - index of handle to unblock
	 * @private
	 */
	unblock(index) {
		deprecated('device.unblock(index)', 'handle.unblock()');
		this.handles[index].unblock();
	}

	/**
	 * Moves a handle with tween movement behaviour.
	 * @deprecated **Use {@link Device#movePantoTo} instead!**
	 * @param {number} index - index of handle to move
	 * @param {Vector} target - position the handle should be moved to
	 * @param {Object} [options] - passed to movePantoTo
	 * @private
	 */
	async tweenPantoTo(index, target, options) {
		deprecated('device.tweenPantoTo(index, target, options)', 'handle.moveTo(target, options)');
		await this.handles[index].moveTo(target, options);
	}

	/**
	 * Represents the timesteps for moving objects
	 */
	step() {
		console.log('@TODO remove step :D');
		for(let i = 0; i < 2; i++) {
			const object = i === 0 ? this.me : this.it;
			const difference = this.lastKnownPositions[i].difference(object.position);
			object.setMovementDirection(difference);
			object.move();
			if(object.processingCollision) {
				const force = object.position.difference(this.lastKnownPositions[i]).scale(smallPantoForceScale);
				this.applyForceTo(i, force);
			} else if(object.doneColliding) {
				this.unblock(i);
			}
		}
	}

	/*
	 ****************************************************************
	 * --> voice interaction related methods
	 ****************************************************************
	 */

	/**
	 * Speaks a text.
	 * @param {string} text - the text to speak
	 * @param {string} [language=broker.defaultLanguage] - the language to speak
	 * @param {number} [speed=broker.defaultSpeechSpeed] - the speed that is spoken with
	 * @example
	 * await device.speakText('Hallo Welt!');
	 * await device.speakText('Hello World', 'EN', 1.3);
	 */
	async speakText(text, language, speed) {
		try {
			await this.broker._voiceInteraction.speakText(text, language, speed);
		} catch(err) {
			this.emit('error', err);
		}
	}

	/**
	 * Works like device.on(...) but for keywords.
	 * @param {string} keyword - the keyword to listen for
	 * @param {function} handler - the handler to execute when the keyword is recognized
	 * @returns {Device} the device the method was called on
	 * @example
	 * device.on('Hotels', showHotels);
	 */
	onKeyword(keyword, handler) {
		return this.on(keywordEvent(keyword), handler);
	}

	/**
	 * Works like device.once(...) but for keywords.
	 * It is like onKeyword, but the handler gets called only once.
	 * @param {string} keyword - the keyword to listen for
	 * @param {function} handler - the handler to execute when the keyword is recognized
	 * @returns {Device} the device the method was called on
	 * @example
	 * device.once('Shutdown', c);
	 */
	onceKeyword(keyword, handler) {
		return this.once(keywordEvent(keyword), handler);
	}

	/**
	 * Works like device.off(...) but for keywords.
	 * It is like onKeyword, but the handler gets removed.
	 * @param {string} keyword - the keyword to listen for
	 * @param {function} handler - the handler to execute when the keyword is recognized
	 * @returns {Device} the device the method was called on
	 * @example
	 * device.off('Hotels', showHotels);
	 */
	offKeyword(keyword, handler) {
		return this.off(keywordEvent(keyword), handler);
	}

	/**
	 * Works like device.emit(...) but for keywords.
	 * Emits a keyword event.
	 * @param {string} keyword - the keyword to listen for
	 * @param {function} handler - the handler to execute when the keyword is recognized
	 * @returns {Device} the device the method was called on
	 * @example
	 * device.emitKeyword('Hotel');
	 */
	emitKeyword(keyword) {
		return this.emit(keywordEvent(keyword));
	}
}

module.exports = Device;
