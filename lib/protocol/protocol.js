'use strict';

const EventEmitter = require('events');
const SerialPort = require('serialport');
const Message = require('./message');

const MESSAGE_NAMES = [
	'error',
	'config',
	'encoderValues',
];

/**
 * A config message was recived.
 * @memberof Protocol
 * @event Protocol#config
 * @param {Message} msg the config message
 */

/**
 * An encoderValues message was recived.
 * @memberof Protocol
 * @event Protocol#encoderValues
 * @param {Message} msg the encoderValues message
 */

const fastBufferConcat = (a, b) => Buffer.concat([a, b], a.length + b.length);

/**
 * A connection to a physical device using the dual panto protocol.
 * @prop {SerialPort} port the serial port instance
 * @prop {Buffer} [buffer] the current recieve buffer
 * @param {string} port the port name
 * @private
 */
class Protocol extends EventEmitter {
	constructor(port) {
		super();
		this.port = new SerialPort(port)
			.on('error', err => {
				/**
				 * A protocol error occurred.
				 * @memberof Protocol
				 * @event Protocol#error
				 * @param {Error} err the error
				 */
				this.emit('error', err);
			})
			.on('data', data => {
				this.handleData(data);
			})
			.on('open', () => {
				/**
				 * The connection is open.
				 * @memberof Protocol
				 * @event Protocol#open
				 */
				this.emit('open');
			})
			.on('close', () => {
				/**
				 * The connection is closed.
				 * @memberof Protocol
				 * @event Protocol#close
				 */
				this.emit('close');
			});
		this.buffer = null;
	}

	/**
	 * Handle incomming data.
	 * @param {Buffer} chunk the new data
	 */
	handleData(chunk) {
		if(this.buffer !== null) {
			chunk = fastBufferConcat(this.buffer, chunk);
			this.buffer = null;
		}

		let pos = 0;
		while((pos = chunk.indexOf(0) + 1) !== 0) {
			let msg = null;
			try {
				msg = Message.decode(chunk.slice(0, pos));
			} catch(err) {
				this.emit('error', err);
			}
			if(msg !== null)
				this.handleMessage(msg);
			chunk = chunk.slice(pos);
		}

		if(chunk.length !== 0)
			this.buffer = chunk;
	}

	/**
	 * Handle an incomming message.
	 * @param {Message} msg the new message
	 */
	handleMessage(msg) {
		const name = MESSAGE_NAMES[msg.command] || 'unknownCommand';
		if(name === 'error') {
			const {payload} = msg;
			const pos = payload.lastIndexOf(0);
			msg = payload.toString('utf8', pos + 1);
			if(pos !== 0) {
				msg += ':';
				msg += payload.toString('hex', 0, pos)
					.toUpperCase()
					.replace(/../g, ' 0x$&');
			}
			msg = new Error(msg);
		}

		if(!this.emitMessage(name, msg)) {
			/**
			 * An unhandled message was recived.
			 * @memberof Protocol
			 * @event Protocol#unhandledMessage
			 * @param {Message} msg the unhandled message
			 */
			if(!this.emitMessage('unhandledMessage', name, msg)) {
				if(name === 'error')
					console.log('Protocol: unhandled message:', msg);
				else
					console.log('Protocol: unhandled message:', name, msg.payload);
			}
		}
	}

	/**
	 * Emit an message event and reset the message index after each listener.
	 * @param {string} name the message name
	 * @param {Message} msg the message
	 * @returns {boolean} whether the message was handled
	 */
	emitMessage(name, msg) {
		let handled = false;
		for(const listener of this.listeners(name)) {
			listener.call(this, msg);
			msg.done(name);
			handled = true;
		}
		return handled;
	}

	/**
	 * Send a message.
	 * @param {Messafe} msg the message
	 */
	send(msg) {
		const packet = msg.encode();
		this.port.write(packet);
	}
}

module.exports = Protocol;
