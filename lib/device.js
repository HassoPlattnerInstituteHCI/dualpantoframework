'use strict';

const serial = require('../build/Release/serial.node');
const Vector = require('../Vector.js');
const EventEmitter = require('events');
const TWEEN = require('@tweenjs/tween.js');
const TWEEN_INTERVAL = 30;

let tweenStackCounter = 0;

// require of shared broker (moved to the end)
let broker = null;

const CONTROL_METHOD_POSITION = 0;
const CONTROL_METHOD_FORCE = 1;

const animateTween = () => {
	TWEEN.update();
	if(tweenStackCounter > 0)
		setTimeout(animateTween, TWEEN_INTERVAL);
};

/**
 * Class for panto interaction.
 * @extends EventEmitter
 */
class Device extends EventEmitter {
	/**
	 * Creates a new device.
	 * @param {string} port - port on that the device is connected.
	 */
	constructor(port) {
		super();
		if(port === 'virtual') {
			let index = 0;
			port = 'virtual0';
			while(broker.devices.has(port))
				port = `virtual${index++}`;
		} else {
			if(process.platform === 'darwin')
				port = port.replace('/tty.', '/cu.');
			else if(process.platform === 'win32')
				port = `//.//${port}`;
			if(broker.devices.has(port))
				return broker.devices.get(port);
			this.serial = true;
		}
		this.port = port;
		this.sendQueue = [];
		this.lastKnownPositions = [];
		this.lastKnownPositions[0] = new Vector(0, 0, 0);
		this.lastKnownPositions[1] = new Vector(0, 0, 0);
		this.lastTargetPositions = [];
		this.lastReceiveTime = process.hrtime();
		broker.devices.set(this.port, this);
		if(this.serial)
			this.serial = serial.open(this.port);
	}

	/**
	 * Disconnect the device.
	 * @private
	 */
	disconnect() {
		if(this.serial)
			serial.close(this.serial);
		broker.devices.delete(this.port);
	}

	/**
	 * Pulls new data from serial connection and handles them.
	 * @private
	 */
	poll() {
		if(!this.serial)
			return;
		const time = process.hrtime();
		if(time[0] > this.lastReceiveTime[0] + broker.disconnectTimeout) {
			this.disconnect();
			return;
		}
		const packets = serial.poll(this.serial);
		if(packets.length === 0)
			return;
		this.lastReceiveTime = time;
		const packet = packets[packets.length - 1];
		if(packet.length === 16) {
			this.hardwareConfigHash = packet;
		} else if(packet.length === 4 * 6) {
			for(let i = 0; i < 2; ++i) {
				const start = i * 12;
				const newPosition = new Vector(
					packet.readFloatLE(start),
					packet.readFloatLE(start + 4),
					packet.readFloatLE(start + 8)
				);
				if(this.lastKnownPositions[i] && newPosition.difference(this.lastKnownPositions[i]).length() <= 0)
					continue;
				this.lastKnownPositions[i] = newPosition;
				this.emit('handleMoved', i, this.lastKnownPositions[i]);
			}
		}
		if(this.serial && this.sendQueue.length > 0)
			serial.send(this.serial, this.sendQueue[this.sendQueue.length - 1]);
		this.sendQueue = [];
	}

	/**
	 * Enqueues a packet to be send via the serial connection to the panto.
	 * @param {Buffer} packet - containing the payload data
	 * @private
	 */
	send(packet) {
		this.sendQueue.push(packet);
	}

	/**
	 * sets new positions if handles are moved by ViDeb
	 * @param {number} index - index of moved handle
	 * @param {Vector} position - position the handle was moved to
	 * @private
	 */
	handleMoved(index, position) {
		position = new Vector(position.x, position.y, position.r);
		this.emit('handleMoved', index, position);
	}

	/**
	 * moves a Handle to a position
	 * @param {number} index - index of handle to move
	 * @param {Vector} target - position the handle should be moved to
	 * @example
	 * device.moveHandleTo(0, new Vector(35, -50, 0));
	 */
	moveHandleTo(index, target) {
		this.lastTargetPositions[index] = target;
		this.emit('moveHandleTo', index, target);
		if(!this.serial)
			return;
		const values = target ? [target.x, target.y, target.r] : [NaN, NaN, NaN];
		const packet = Buffer.alloc(1 + 1 + (3 * 4));
		packet[0] = CONTROL_METHOD_POSITION;
		packet[1] = index;
		packet.writeFloatLE(values[0], 2);
		packet.writeFloatLE(values[1], 6);
		packet.writeFloatLE(values[2], 10);
		this.send(packet);
	}

	/**
	 * applies force vector to the pantograph
	 * @param {number} index - index of handle to apply force
	 * @param {Vector} force - vector of force to render. 3rd element will be ignored.
	 * @example
	 * device.applyForceTo(0, new Vector(5, 7));
	 */
	applyForceTo(index, force) {
		this.emit('applyForceTo', index, force);
		if(!this.serial)
			return;
		const values = force ? [force.x, force.y, 0] : [NaN, NaN, NaN];
		const packet = Buffer.alloc(1 + 1 + (3 * 4));
		packet[0] = CONTROL_METHOD_FORCE;
		packet[1] = index;
		packet.writeFloatLE(values[0], 2);
		packet.writeFloatLE(values[1], 6);
		packet.writeFloatLE(values[2], 10);
		this.send(packet);
	}

	/**
	 * Returns a promise that invokes handle movement with tween behaviour
	 * @param {number} index - index of handle to move
	 * @param {Vector} target - position the handle should be moved to
	 * @param {number} [duration=500] - time in ms that the movement shall take.
	 * @param {Object} [interpolationMethod=TWEEN.Easing.Quadratic.Out] - tween function that is used to generate the movement.
	 * @returns {promise} the promise executing the movement
	 * @example
	 * await device.movePantoTo(1, new Vector(24, -38, Math.PI/2));
	 *
	 * // slow moevement (1 second = 1000 milliseconds)
	 * await device.movePantoTo(1, new Vector(24, -38, Math.PI/2), 1000);
	 */
	movePantoTo(index, target, duration = 500, interpolationMethod = TWEEN.Easing.Quadratic.Out) {
		return new Promise(resolve => {
			this.tweenPantoTo(index, target, duration, interpolationMethod);
			resolve(resolve);
		});
	}

	/**
	 * Returns a promise that unblocks a handle
	 * @param {number} index - index of handle to unblock
	 * @returns {Promise} the promise executing the unblock
	 * @example
	 * await device.unblockHandle();
	 */
	unblockHandle(index) {
		return new Promise(resolve => {
			this.unblock(index);
			resolve(resolve);
		});
	}

	/**
	 * Unblocks a handle
	 * @deprecated **Use {@link Device#unblockHandle} instead!**
	 * @param {number} index - index of handle to unblock
	 * @private
	 */
	unblock(index) {
		this.moveHandleTo(index);
	}

	/**
	 * Moves a handle with tween movement behaviour
	 * @deprecated **Use {@link Device#movePantoTo} instead!**
	 * @param {number} index - index of handle to move
	 * @param {Vector} target - position the handle should be moved to
	 * @param {number} [duration=500] - time in ms that the movement shall take.
	 * @param {Object} [interpolationMethod=TWEEN.Easing.Quadratic.Out] - tween function that is used to generate the movement.
	 * @private
	 */
	tweenPantoTo(index, target, duration = 500, interpolationMethod = TWEEN.Easing.Quadratic.Out) {
		const tweenPosition = (index < this.lastKnownPositions.length && this.lastKnownPositions[index]) || null;

		if(tweenPosition) {
			tweenStackCounter++;
			if(tweenStackCounter === 1)
				setTimeout(animateTween, TWEEN_INTERVAL);

			// create a new tween that modifies 'tweenPosition'.
			new TWEEN.Tween(tweenPosition)
				.to(target, duration)
				.easing(interpolationMethod)
				.onUpdate(() => {
					// called after tween.js updates 'tweenPosition'.
					this.moveHandleTo(index, tweenPosition);
				})
				.onComplete(() => {
					tweenStackCounter--;
				})
				.start();
		}
	}
}

module.exports = Device;

/*
 * needs to be after export because of the following dependencies:
 * device -> shared -> broker -> device
 * javascript is so mouch fun :D
 */
// eslint-disable-next-line prefer-destructuring
broker = require('./shared').broker;
