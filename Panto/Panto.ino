#include <Encoder.h>
#include <string.h>
#include "config.h"

#define OUTPUT_POWER_LIMIT 0.2 // 20%
#define PWM_MAX 4095 // (2^12)-1

unsigned long prevTime;
Encoder* encoder[dofCount];
float angle[dofCount], target[dofCount], previousDiff[dofCount], integral[dofCount], pidFactor[3] = { 25.0, 0.0, 0.0 };
unsigned char inChecksum, outChecksum;

void setup() {
  SerialUSB.begin(0); // Default is 9600
  analogWriteResolution(12);

  // https://forum.arduino.cc/index.php?topic=367154.0
  // http://playground.arduino.cc/Main/TimerPWMCheatsheet

  for(unsigned char i = 0; i < dofCount; ++i) {
    angle[i] = 0.0;
    target[i] = 0.0;
    previousDiff[i] = 0.0;
    integral[i] = 0.0;
    encoder[i] = new Encoder(encoderAPin[i], encoderBPin[i]);
    pinMode(motorDirPin[i], OUTPUT);
    pinMode(motorPwmPin[i], OUTPUT);
    digitalWrite(motorPwmPin[i], LOW);
  }
  prevTime = micros();
}

union Number32 {
  float f;
  int32_t i;
};

void sendNumber32(union Number32 value) {
  unsigned char buffer[4];
  for(unsigned char i = 0; i < sizeof(buffer); ++i) {
    buffer[i] = (unsigned char)(value.i>>(i*8));
    outChecksum ^= buffer[i];
  }
  SerialUSB.write(buffer, sizeof(buffer));
}

union Number32 receiveNumber32() {
  unsigned char buffer[4];
  SerialUSB.readBytes(buffer, sizeof(buffer));
  for(unsigned char i = 0; i < sizeof(buffer); ++i)
    inChecksum ^= buffer[i];
  Number32 result;
  result.i = buffer[0] | (buffer[1]<<8) | (buffer[2]<<16) | (buffer[3]<<24);
  return result;
}

void loop() {
  // Read and store encoder angles
  for(unsigned char i = 0; i < dofCount; ++i) {
    angle[i] = 2.0 * M_PI * encoder[i]->read() / encoderSteps[i];
    if(encoderFlipped[i])
      angle[i] *= -1;
  }

  // Send encoder angles
  outChecksum = 0;
  SerialUSB.write("SYNC");
  SerialUSB.write(4*(dofCount+3));
  union Number32 aux;
  for(unsigned char i = 0; i < dofCount; ++i) {
    aux.f = angle[i];
    sendNumber32(aux);
  }
  for(unsigned char i = 0; i < 3; ++i) {
    aux.f = pidFactor[i];
    sendNumber32(aux);
  }
  SerialUSB.write(outChecksum);
  SerialUSB.flush();

  // Receive motor commands
  char syncBuffer[4];
  while(SerialUSB.available() >= 11) {
    inChecksum = 0;
    if(SerialUSB.read() != 'S' ||
       SerialUSB.read() != 'Y' ||
       SerialUSB.read() != 'N' ||
       SerialUSB.read() != 'C' ||
       SerialUSB.read() != 5)
      continue;
    unsigned char i = SerialUSB.read();
    inChecksum ^= i;
    Number32 value = receiveNumber32();
    unsigned char checksum = SerialUSB.read();
    if(checksum == inChecksum) {
      if(i >= dofCount)
        pidFactor[i-dofCount] = value.f;
      else
        target[i] = value.f;
    }
  }

  unsigned long now = micros();
  float dt = now-prevTime;
  prevTime = now;
  for(unsigned char i = 0; i < dofCount; ++i) {
    if(isnan(target[i])) { // target[i] != target[i]
      digitalWrite(motorPwmPin[i], LOW);
      continue;
    }

    float error = target[i] - angle[i];

    // Direction
    unsigned char dir = error < 0;
    if(motorFlipped[i])
      dir = !dir;
    digitalWrite(motorDirPin[i], dir);
    error = fabs(error);

    // Power: PID
    integral[i] += error * dt;
    float derivative = (error - previousDiff[i]) / dt;
    float voltage = pidFactor[0]*error + pidFactor[1]*integral[i] + pidFactor[2]*derivative;
    previousDiff[i] = error;
    analogWrite(motorPwmPin[i], min(voltage, OUTPUT_POWER_LIMIT) * PWM_MAX);
  }
}
