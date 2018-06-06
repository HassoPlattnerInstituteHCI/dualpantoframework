// Communication Protocol - Reading Part

// handle an incomming message
void protocolGotMessage() {
	// package is too short to contain a checksum and a command
	if(protocolRxLength <= protocolPayloadPosition) {
		protocolWriteByte(protocolRxLength);
		protocolErrorF("Package Too Short");
		return;
	}

	// cobs decoding
	int i = protocolOverheadPosition + protocolRxBuffer[protocolOverheadPosition];
	while(i < protocolRxLength) {
		byte b = protocolRxBuffer[i];
		protocolRxBuffer[i] = 0;
		i += b;
	}

	// calculate checksum
	byte checksum = crc8slice(
		protocolRxBuffer,
		protocolChecksumPosition + 1,
		protocolRxLength);

	// compare received and calculated checksum
	if(protocolRxBuffer[protocolChecksumPosition] != checksum) {
		protocolWriteByte(protocolRxBuffer[protocolChecksumPosition]);
		protocolWriteByte(checksum);
		protocolErrorF("Invalid Checksum");
		return;
	}

	// check if this is a known command
	byte command = protocolRxBuffer[protocolCommandPosition];
	if(command >= sizeof(protocolHandler) / sizeof(ProtocolHandler)) {
		protocolWriteByte(command);
		protocolErrorF("Unknown Command");
		return;
	}

	// set rx index to the beginning and invoke command handler
	protocolRxIndex = protocolPayloadPosition;
	protocolHandler[command]();
}

// read a byte from the rx buffer
byte protocolReadByte() {
	return protocolRxBuffer[protocolRxIndex++];
}

#define protocolReadByteAs(T) ((T)protocolReadByte())

// read a 32 bit integer from the rx buffer
uint32_t protocolReadInt32() {
	uint32_t v = protocolReadByteAs(uint32_t);
	v |= protocolReadByteAs(uint32_t) << 8;
	v |= protocolReadByteAs(uint32_t) << 16;
	v |= protocolReadByteAs(uint32_t) << 24;
	return v;
}

// read a 16 bit integer from the rx buffer
uint16_t protocolReadInt16() {
	uint16_t v = protocolReadByteAs(uint16_t);
	v |= protocolReadByteAs(uint16_t) << 8;
	return v;
}

// check if there are count bytes remaining
// sends a error message otherwise
// returns true on error
bool protocolCanReadOrError(byte count) {
	count += protocolRxIndex;
	if(count == protocolRxLength)
		return false;

	protocolWriteByte(count);
	protocolWriteByte(protocolRxLength);
	protocolErrorF("Unexpected Package Length");
	return true;
}
