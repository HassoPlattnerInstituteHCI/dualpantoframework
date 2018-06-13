// DualPanto Firmware

#include "motor.h"
#include "config.h"
#include "protocol.h"
#include "commands.h"
#include "device_id.h"

void setup() {
	uniqueIDSetup();
	protocolSetup();

	// https://forum.arduino.cc/index.php?topic=367154.0
	// http://playground.arduino.cc/Main/TimerPWMCheatsheet
	#if DP_PWM_BITS != 8
		analogWriteResolution(DP_PWM_BITS);
	#endif
}

// in milliseconds
const uint32_t motorTimeout = 100;

uint32_t lastLoop = 0;
uint32_t loopInterval = 0;
uint32_t lastMotorUpdate = 0;
bool motorsActive = false;
bool motorsChanged = false;

void loop() {
	protocolLoop();

	if(!loopInterval)
	 	return;

	uint32_t deltaTime = millis() - lastMotorUpdate;
	if(deltaTime >= motorTimeout) {
		if(motorsActive) {
			protocolErrorF("Motor Timeout");
		}

		for(byte i = 0; i < numMotors; i++) {
			motors[i].power = 0;
		}

		motorsActive = false;
		motorsChanged = true;
		lastMotorUpdate = millis();
	}

	if(motorsChanged) {
		motorsChanged = false;

		for(byte i = 0; i < numMotors; i++) {
			motors[i].updateMotor();
		}
	}

	deltaTime = micros() - lastLoop;
	if(deltaTime >= loopInterval) {
		lastLoop += deltaTime;

		for(byte i = 0; i < numMotors; i++) {
			motors[i].readEncoder();
		}

		protocolWriteInt32(deltaTime);
		for(byte i = 0; i < numMotors; i++) {
			protocolWriteInt32(motors[i].steps);
		}
		protocolSend(protocolCommandEncoderValues);
	}
}

const byte currentVersion = 1;
void handleGetConfig() {
	if(protocolCanReadOrError(1))
		return;

	byte version = protocolReadByte();
	if(version != currentVersion) {
		protocolWriteByte(version);
		protocolWriteByte(currentVersion);
		protocolErrorF("Invalid Version");
		return;
	}

	loopInterval = 0;
	protocolWriteByte(DP_PWM_BITS);
	protocolWriteByte(numMotors);
	protocolWriteInt32(configurationID);
	protocolWriteByte(deviceIDLength);
	for(byte i = 0; i < deviceIDLength; i++) {
		protocolWriteByte(deviceID[i]);
	}
	for(byte i = 0; i < numMotors; i++) {
		protocolWriteInt16(motors[i].maxPower);
	}
	protocolSend(protocolCommandConfig);
}

void handleStart() {
	if(protocolCanReadOrError(4))
		return;

	loopInterval = protocolReadInt32();
}

void handleSetMotors() {
	if(protocolCanReadOrError(numMotors * 2))
		return;

	for(byte i = 0; i < numMotors; i++) {
		motors[i].power = protocolReadInt16();
	}

	motorsActive = true;
	motorsChanged = true;
	lastMotorUpdate = millis();
}
