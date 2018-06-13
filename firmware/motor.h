// Motor + Encoder

#ifndef _MOTOR_H
#define _MOTOR_H

#include <Encoder.h>

class Motor {
private:
	Encoder encoder;
	const byte motorAPin;
	const byte motorBPin;
	const byte motorPWMPin;

public:
	const uint16_t maxPower;

	uint32_t steps;
	int16_t power;

	Motor(
		const byte encoderAPin,
		const byte encoderBPin,
		const byte motorAPin,
		const byte motorBPin,
		const byte motorPWMPin,
		const uint16_t maxPower
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
