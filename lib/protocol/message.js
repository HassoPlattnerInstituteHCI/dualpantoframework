'use strict';

const crc8 = require('./crc8');
const {ENUM} = require('../util');

const [
	OVERHEAD_POSITION,
	CHECKSUM_POSITION,
	COMMAND_POSITION,
	PAYLOAD_POSITION,
] = ENUM;

/**
 * A protocol message.
 * @prop {Buffer} buffer the message buffer
 * @prop {number} index the current position in the buffer
 * @param {Buffer} [buffer] a buffer or a new one is created
 * @private
 */
class Message {
	constructor(buffer = Buffer.alloc(256)) {
		this.buffer = buffer;
		this.index = PAYLOAD_POSITION;
	}

	/**
	 * The message command byte.
	 * @type {number}
	 */
	get command() {
		return this.buffer[COMMAND_POSITION];
	}

	set command(value) {
		this.buffer[COMMAND_POSITION] = value;
	}

	/**
	 * The message payload buffer slice.
	 * @type {Buffer}
	 */
	get payload() {
		return this.buffer.slice(PAYLOAD_POSITION, -1);
	}

	/**
	 * Write a byte to the buffer.
	 * @param {number} b the byte
	 */
	writeByte(b) {
		this.buffer[this.index++] = b;
	}

	/**
	 * Write an int16 to the buffer.
	 * @param {number} value the value
	 */
	writeInt16(value) {
		this.index = this.buffer.writeInt16LE(value, this.index);
	}

	/**
	 * Write an int32 to the buffer.
	 * @param {number} value the value
	 */
	writeInt32(value) {
		this.index = this.buffer.writeInt32LE(value, this.index);
	}

	/**
	 * Read a byte from the buffer.
	 * @returns {number} the byte
	 */
	readByte() {
		return this.buffer[this.index++];
	}

	/**
	 * Read an int16 value from the buffer.
	 * @returns {number} the value
	 */
	readUInt16() {
		const value = this.buffer.readUInt16LE(this.index);
		this.index += 2;
		return value;
	}

	/**
	 * Read an int32 value from the buffer.
	 * @returns {number} the value
	 */
	readInt32() {
		const value = this.buffer.readInt32LE(this.index);
		this.index += 4;
		return value;
	}

	/**
	 * Read an uint32 value from the buffer.
	 * @returns {number} the value
	 */
	readUInt32() {
		const value = this.buffer.readUInt32LE(this.index);
		this.index += 4;
		return value;
	}

	/**
	 * Read a buffer slice from the buffer.
	 * @param {number} n the number of bytes to read
	 * @returns {Buffer} the buffer slice
	 */
	readBuffer(n) {
		const value = this.buffer.slice(this.index, this.index + n);
		this.index += n;
		return value;
	}

	/**
	 * Ignore the rest of the message.
	 */
	ignore() {
		this.index = this.buffer.length - 1;
	}

	/**
	 * Check whether the message has been read completely.
	 * Log if there are unread parts.
	 * @param {string} name the name of the message
	 */
	done(name) {
		if(this.index !== this.buffer.length - 1)
			console.log(`Message.done: Not all bytes read: ${this.index} / ${this.buffer.length - 1}${name ? ` (${name})` : ''}`);
		this.index = PAYLOAD_POSITION;
	}

	/**
	 * Encode the message according to the dual panto protocol.
	 * This makes the message unusable for further modifications.
	 * @returns {Buffer} the encoded message
	 */
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

	/**
	 * Decode a message buffer.
	 * @param {Buffer} buffer the encoded message
	 * @returns {Message} the decoded message
	 */
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
