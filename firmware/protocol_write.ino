// Communication Protocol - Writing Part

// write a byte to the tx buffer
void protocolWriteByte(byte b) {
	protocolTxBuffer[protocolTxIndex++] = b;
	protocolTxIndex %= protocolBufferLength;
}

// write a 32 bit integer to the tx buffer
void protocolWriteInt32(uint32_t v) {
	protocolWriteByte(v);
	protocolWriteByte(v >> 8);
	protocolWriteByte(v >> 16);
	protocolWriteByte(v >> 24);
}

// write a string from flash to the tx buffer
void protocolWriteFlashString(const __FlashStringHelper *message) {
	// inspired by the arduino core
	// https://github.com/arduino/ArduinoCore-avr/blob/b7c6076/cores/arduino/Print.cpp#L44:L55
	PGM_P p = reinterpret_cast<PGM_P>(message);
	byte b;
	while((b = pgm_read_byte(p++)) != '\0') {
		protocolWriteByte(b);
	}
}

// send a command
void protocolSend(byte command) {
	if(protocolTxIndex < protocolPayloadPosition || protocolTxIndex >= protocolBufferLength - 1) {
		// reset tx index and send error
		protocolTxIndex = protocolPayloadPosition;
		protocolErrorF("Tx Buffer Overflow");
		return;
	}

	// set command, checksum and terminating 0 byte
	protocolTxBuffer[protocolCommandPosition] = command;
	protocolTxBuffer[protocolChecksumPosition] = crc8slice(
		protocolTxBuffer,
		protocolChecksumPosition + 1,
		protocolTxIndex);
	protocolTxBuffer[protocolTxIndex] = 0;

	// cobs encoding
	byte *lastZero = protocolTxBuffer + protocolOverheadPosition;
	byte *ptr = lastZero + 1;

	byte i = protocolTxIndex - (protocolOverheadPosition + 1);
	while(i--) {
		if(*ptr == 0) {
			*lastZero = ptr - lastZero;
			lastZero = ptr;
		}
		ptr++;
	}

	*lastZero = ptr - lastZero;
	*ptr = 0;

	// send the encoded package
	ProtocolSerial.write(protocolTxBuffer, protocolTxIndex + 1);

	// reset tx index
	protocolTxIndex = protocolPayloadPosition;
}

// send a protocol error message
// debug info bytes can be written befor sending this message
void protocolError(const __FlashStringHelper *message) {
	// a 0 byte seperates the debug info from the error message
	protocolWriteByte(0);
	protocolWriteFlashString(message);
	protocolSend(0);
}
