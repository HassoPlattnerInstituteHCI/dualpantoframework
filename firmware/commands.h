// Commands and Handler for Messages

#ifndef _COMMANDS_H
#define _COMMANDS_H

// commands of outgoing messages
enum ProtocolCommands: byte {
	protocolCommandError,
	protocolCommandConfig,
	protocolCommandEncoderValues,
};

// handler for incomming messages
void handleGetConfig();
void handleStart();
void handleSetMotors();

ProtocolHandler protocolHandler[] = {
	handleGetConfig,
	handleStart,
	handleSetMotors,
};

#endif
