// Motor + Encoder

#ifndef _MOTOR_H
#define _MOTOR_H

#include <Encoder.h>

class Motor {
private:
	Encoder encoder;
	byte motorAPin;
	byte motorBPin;
	byte motorPWMPin;
	uint16_t maxPower;

public:
	uint32_t steps;
	int16_t power;

	Motor(
		byte encoderAPin,
		byte encoderBPin,
		byte motorAPin,
		byte motorBPin,
		byte motorPWMPin,
		uint16_t maxPower
	):
	 	encoder(encoderAPin, encoderBPin),
		motorAPin(motorAPin),
		motorBPin(motorBPin),
		motorPWMPin(motorPWMPin),
		maxPower(maxPower)
	{
		pinMode(motorAPin, OUTPUT);
		pinMode(motorBPin, OUTPUT);
		pinMode(motorPWMPin, OUTPUT);
	}

	void readEncoder() {
		steps = encoder.read();
	}

	void updateMotor() {
		digitalWrite(motorAPin, power > 0);
		digitalWrite(motorBPin, power < 0);
		if(power < 0)
			power = -power;
		if((uint16_t)power > maxPower)
			power = maxPower;
		analogWrite(motorPWMPin, power);
	}
};

#endif
