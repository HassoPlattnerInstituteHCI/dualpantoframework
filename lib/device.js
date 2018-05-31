'use strict';

const serial = require('../build/Release/serial.node');
const Vector = require('../Vector.js');
const EventEmitter = require('events');
const TweenGenerator = require('./tween-generator');
const {keywordEvent} = require('./voice-interaction');

const {deprecated} = require('./util');

const CONTROL_METHOD_POSITION = 0;
const CONTROL_METHOD_FORCE = 1;

const NAN_VECTOR = new Vector(NaN, NaN, NaN);

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
	 * @param {boolean} isVirtual - is this a virtual device
	 */
	constructor(broker, port, isVirtual) {
		super();
		this.broker = broker;
		this.port = port;
		this.isVirtual = isVirtual;

		this.lastKnownPositions = [
			new Vector(0, 0, 0),
			new Vector(0, 0, 0),
		];

		this.lastTargetPositions = [
			null,
			null,
		];

		// unix timestamp in milliseconds
		this.lastReceiveTime = Date.now();

		broker.addDevice(this);

		this.serial = isVirtual ? null : serial.open(this.port);
		this.sendQueue = [];
	}

	/**
	 * Disconnect the device.
	 * @private
	 */
	disconnect() {
		if(this.serial)
			serial.close(this.serial);
		this.broker.removeDevice(this);
		this.emit('disconnect');
	}

	/*
	 ****************************************************************
	 * --> serial related methods
	 ****************************************************************
	 */

	/**
	 * Pulls new data from serial connection and handles them.
	 * @private
	 */
	poll() {
		if(!this.isVirtual) {
			deprecated('device.poll on virtual devices');
			return;
		}

		const now = Date.now();
		if(now > this.lastReceiveTime + this.broker.disconnectTimeout) {
			this.disconnect();
			return;
		}

		const packets = serial.poll(this.serial);
		if(packets.length === 0)
			return;

		this.lastReceiveTime = now;

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
		if(this.isVirtual) {
			deprecated('device.send on virtual devices');
			return;
		}
		this.sendQueue.push(packet);
	}

	/*
	 ****************************************************************
	 * --> movement related methods
	 ****************************************************************
	 */

	/**
	 * Returns the current (or last known) position of the handle.
	 * @param {number} index - index of handle
	 * @returns {Vector} the position of the handle
	 */
	getPosition(index) {
		return this.lastKnownPositions[index] || this.lastTargetPositions[index] || null;
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
		this.emit('handleMoved', index, position);
	}

	/**
	 * Moves a handle to a position.
	 * @param {number} index - index of handle to move
	 * @param {Vector} target - position the handle should move to
	 * @example
	 * device.moveHandleTo(0, new Vector(35, -50, 0));
	 */
	moveHandleTo(index, target = null) {
		if(target)
			this.lastTargetPositions[index] = target;
		this.emit('moveHandleTo', index, target);

		if(this.isVirtual) {
			this.lastKnownPositions[index] = target;
			this.emit('handleMoved', index, target);
			return;
		}

		if(!target)
			target = NAN_VECTOR;

		const packet = Buffer.alloc(1 + 1 + (3 * 4));
		packet[0] = CONTROL_METHOD_POSITION;
		packet[1] = index;
		packet.writeFloatLE(target.x, 2);
		packet.writeFloatLE(target.y, 6);
		packet.writeFloatLE(target.r, 10);
		this.send(packet);
	}

	/**
	 * Applies force vector to the pantograph.
	 * @param {number} index - index of handle to apply force
	 * @param {Vector} force - vector of force to render (r component is ignored)
	 * @example
	 * device.applyForceTo(0, new Vector(5, 7));
	 */
	applyForceTo(index, force = null) {
		this.emit('applyForceTo', index, force);

		if(this.isVirtual)
			return;

		if(!force)
			force = NAN_VECTOR;

		const packet = Buffer.alloc(1 + 1 + (3 * 4));
		packet[0] = CONTROL_METHOD_FORCE;
		packet[1] = index;
		packet.writeFloatLE(force.x, 2);
		packet.writeFloatLE(force.y, 6);

		// ignore the last 4 bytes (they are 0 by default)

		this.send(packet);
	}

	/**
	 * Moves a handle with tween movement behaviour.
	 * @param {number} index - index of handle to move
	 * @param {Vector} target - position the handle should move to
	 * @param {Object} [options] - movement options
	 * @param {Object} [options.duration] - time in ms that the movement should take
	 * @param {Object} [options.speed] - speed in units/second the movement should have
	 * @param {Object} [options.interpolationMethod] - tween function that is used to generate the movement
	 * @param {Object} [options.position] - the position that the movement should start from
	 * @example
	 * await device.movePantoTo(1, new Vector(24, -38, Math.PI/2));
	 *
	 * // slow movement (1 second = 1000 milliseconds)
	 * await device.movePantoTo(1, new Vector(24, -38, Math.PI/2), {duration: 1000});
	 *
	 * // fast movement, with speed (100 = a distance of 50 should take 0.5 sec)
	 * await device.movePantoTo(1, new Vector(-25, -38, Math.PI/2), {speed: 100});
	 */
	async movePantoTo(index, target, options = {}) {
		const {
			speed = null,
			duration = null,
			interpolationMethod = this.broker.defaultInterpolationMethod,
			position = this.getPosition(index),
		} = options;

		if(!position) {
			console.error('device.movePantoTo: unable to execute movement, unknown last postion');
			return;
		}

		const distance1000 = target.difference(position).length() * 1000;

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

		const tweenGenerator = new TweenGenerator(
			position,
			target,
			calculatedDuration,
			interpolationMethod
		);
		for(const positionPromise of tweenGenerator) {
			const position = await positionPromise;
			this.moveHandleTo(index, position);
		}
	}

	/**
	 * Unblocks a handle. This enables free movement.
	 * @param {number} index - index of handle to unblock
	 * @example
	 * await device.unblockHandle();
	 */
	unblockHandle(index) {
		this.moveHandleTo(index);
	}

	/**
	 * Unblocks a handle.
	 * @deprecated **Use {@link Device#unblockHandle} instead!**
	 * @param {number} index - index of handle to unblock
	 * @private
	 */
	unblock(index) {
		deprecated('device.unblock(index)', 'device.unblockHandle(index)');
		this.unblockHandle(index);
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
		deprecated('device.tweenPantoTo(index, target)', 'device.movePantoTo(index, target)');
		await this.movePantoTo(index, target, options);
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
