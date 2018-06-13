'use strict';

const crc8 = require('./crc8');
const {ENUM} = require('../util');

const [
	OVERHEAD_POSITION,
	CHECKSUM_POSITION,
	COMMAND_POSITION,
	PAYLOAD_POSITION,
] = ENUM;

class Message {
	constructor(buffer = Buffer.alloc(256)) {
		this.buffer = buffer;
		this.index = PAYLOAD_POSITION;
	}

	get command() {
		return this.buffer[COMMAND_POSITION];
	}

	set command(value) {
		this.buffer[COMMAND_POSITION] = value;
	}

	get payload() {
		return this.buffer.slice(PAYLOAD_POSITION, -1);
	}

	writeByte(b) {
		this.buffer[this.index++] = b;
	}

	writeInt16(value) {
		this.index = this.buffer.writeInt16LE(value, this.index);
	}

	writeInt32(value) {
		this.index = this.buffer.writeInt32LE(value, this.index);
	}

	readByte() {
		return this.buffer[this.index++];
	}

	readUInt16() {
		const value = this.buffer.readUInt16LE(this.index);
		this.index += 2;
		return value;
	}

	readInt32() {
		const value = this.buffer.readInt32LE(this.index);
		this.index += 4;
		return value;
	}

	readUInt32() {
		const value = this.buffer.readUInt32LE(this.index);
		this.index += 4;
		return value;
	}

	readBuffer(n) {
		const value = this.buffer.slice(this.index, this.index + n);
		this.index += n;
		return value;
	}

	ignore() {
		this.index = this.buffer.length - 1;
	}

	done(name) {
		if(this.index !== this.buffer.length - 1)
			console.log(`Message.done: Not all bytes read: ${this.index} / ${this.buffer.length - 1}${name ? ` (${name})` : ''}`);
		this.index = PAYLOAD_POSITION;
	}

	encode() {
		const length = this.index + 1;
		const buffer = this.buffer.slice(0, length);
		this.buffer = null;
		buffer[CHECKSUM_POSITION] = crc8(buffer.slice(CHECKSUM_POSITION + 1, this.index));

		let code = OVERHEAD_POSITION;
		for(let i = 1; i < length; i++) {
			if(buffer[i] === 0) {
				buffer[code] = i - code;
				code = i;
			}
		}

		return buffer;
	}

	static decode(buffer) {
		const end = buffer.length - 1;
		let i = OVERHEAD_POSITION + buffer[OVERHEAD_POSITION];
		while(i < end) {
			const b = buffer[i];
			buffer[i] = 0;
			i += b;
		}

		if(i !== end) {
			const err = new Error('Message.decode: Invalid COBS Encoding');
			err.buffer = buffer;
			err.index = i;
			err.length = buffer.length;
			throw err;
		}

		const checksum = crc8(buffer.slice(CHECKSUM_POSITION + 1, -1));
		if(checksum !== buffer[CHECKSUM_POSITION]) {
			const err = new Error('Message.decode: Invalid Checksum');
			err.buffer = buffer;
			err.checksum = buffer[CHECKSUM_POSITION];
			err.expected = checksum;
			throw err;
		}

		return new Message(buffer);
	}
}

module.exports = Message;
