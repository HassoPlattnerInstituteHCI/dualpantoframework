'use strict';

const EventEmitter = require('events');
const SerialPort = require('serialport');
const Message = require('./message');

const MESSAGE_NAMES = [
	'error',
	'config',
	'encoderValues',
];

const fastBufferConcat = (a, b) => Buffer.concat([a, b], a.length + b.length);

class Protocol extends EventEmitter {
	constructor(device, port) {
		super();
		this.device = device;
		this.port = new SerialPort(port)
			.on('error', err => {
				this.emit('error', err);
			})
			.on('data', data => {
				this.handleData(data);
			})
			.on('open', () => {
				this.emit('open');
			})
			.on('close', () => {
				this.emit('close');
			});
		this.buffer = null;
	}

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
			if(!this.emitMessage('unhandledMessage', name, msg)) {
				if(name === 'error')
					console.log('Protocol: unhandled message:', msg);
				else
					console.log('Protocol: unhandled message:', name, msg.payload);
			}
		}
	}

	emitMessage(name, msg) {
		let handled = false;
		for(const listener of this.listeners(name)) {
			listener.call(this, msg);
			msg.done(name);
			handled = true;
		}
		return handled;
	}

	send(message) {
		const packet = message.encode();
		this.port.write(packet);
	}
}

module.exports = Protocol;
