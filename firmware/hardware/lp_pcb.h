// Little Panto - PCB Version

// pwm resolution in bits
#define DP_PWM_BITS 8

// maximum pwm value
const uint16_t pwmMax = (1 << DP_PWM_BITS) - 1;

// number of motots
const byte numMotors = 6;

// device configuration identifier
const uint32_t configurationID = 1;

// Motor(encoderAPin, encoderBPin, motorAPin, motorBPin, motorPWMPin, motorMax)
Motor motors[numMotors] = {
	// upper panto - left motor
	Motor(48, 46, 25, 23,  2, 0.4 * pwmMax),

	// upper panto - right motor
	Motor(52, 50, 10,  9,  8, 0.4 * pwmMax),

	// upper panto - handle motor
	Motor(32, 30, 36, 34, 3, 0.2 * pwmMax),

	// lower panto - left motor
	Motor(26, 28,  5,  6,  7, 0.4 * pwmMax),

	// lower panto - right motor
	Motor(22, 24, 11, 12, 13, 0.4 * pwmMax),

	// lower panto - handle motor
	Motor(42, 44, 38, 40,  4, 0.2 * pwmMax),
};

// the serial port used by the protocol
// e.g. Serial, Serial1, Serial2, Serial3, SerialUSB
// note: not all serial ports are available on all arduinos
#define ProtocolSerial SerialUSB

// the serial port used by the protocol
const uint32_t protocolSpeed = 115200;
