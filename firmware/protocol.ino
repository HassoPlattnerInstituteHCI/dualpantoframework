// Communication Protocol

// protocol stuff that should happen in the setup
void protocolSetup() {
	ProtocolSerial.begin(protocolSpeed);
}

// protocol stuff that should happen in the loop
void protocolLoop() {
	while(ProtocolSerial.available()) {
		// packages are 0 terminated
		byte b = ProtocolSerial.read();
		if(b) {
			// store the byte on the buffer and prevent overflow
			protocolRxBuffer[protocolRxLength++] = b;
			protocolRxLength %= protocolBufferLength;
		} else {
			// package complete, handle it and reset the rx length
			protocolRxBuffer[protocolRxLength] = 0;
			protocolGotMessage();
			protocolRxLength = 0;
		}
	}
}
