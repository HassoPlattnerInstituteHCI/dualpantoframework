#ifndef _PROTOCOL_H
#define _PROTOCOL_H

// helper to write a protocol error from flash
#define protocolErrorF(msg) protocolError(F(msg))

// length of the protocol buffers
// should be <= 256
const int protocolBufferLength = 256;

// positions of some special bytes
enum ProtocolPosition: byte {
	protocolOverheadPosition,
	protocolChecksumPosition,
	protocolCommandPosition,
	protocolPayloadPosition,
};

// type of functions that handle an incomming message
typedef void (* const ProtocolHandler)();

// handler functions for incomming messages
extern ProtocolHandler protocolHandler[];

// the rx and tx buffer (rx = receive buffer, tx = transmit buffer)
byte protocolRxBuffer[protocolBufferLength];
byte protocolTxBuffer[protocolBufferLength];

// length of current rx message
byte protocolRxLength = 0;

// current position in the rx message
byte protocolRxIndex = protocolPayloadPosition;

// checksum of the current rx message
byte protocolRxChecksum = 0;

// current position in the tx message (= length of the message)
byte protocolTxIndex = protocolPayloadPosition;

#endif
