#include "panto.h"

unsigned long prevTime, heartbeatCountdown = 0;

void setup() {
  SerialUSB.begin(115200);
  analogWriteResolution(12);

  // https://forum.arduino.cc/index.php?topic=367154.0
  // http://playground.arduino.cc/Main/TimerPWMCheatsheet

  for(unsigned char i = 0; i < pantoCount; ++i)
    pantos[i].setup(i);
  delay(1000);
  for(unsigned char i = 0; i < pantoCount; ++i)
    pantos[i].calibrationEnd();
  
  prevTime = micros();
}

void serialCommandPosition(unsigned char pantoIndex, float* values) {
  if (pantoIndex < pantoCount) {
    pantos[pantoIndex].isforceRendering = false;
    pantos[pantoIndex].target = Vector2D(values[0], values[1]);
    destinationAngle[pantoIndex*3+2] = values[2];
    pantos[pantoIndex].inverseKinematics();
  }
}

void serialCommandForce(unsigned char pantoIndex, float* values) {
  if (pantoIndex < pantoCount) {
    pantos[pantoIndex].force[0] = values[0];
    pantos[pantoIndex].force[1] = values[1];
    pantos[pantoIndex].isforceRendering = true;
  }
}

void serialCommandPID(unsigned char pantoIndex, float* values) {
  if (pantoIndex == 0) {
    pidFactorPanto[0] = values[0];
    pidFactorPanto[1] = values[1];
    pidFactorPanto[2] = values[2];
  } else if (pantoIndex == 1) {
    pidFactorHandle[0] = values[0];
    pidFactorHandle[1] = values[1];
    pidFactorHandle[2] = values[2];
  }
}

void loop() {
  // Receive motor commands
  const unsigned char expectedPayloadLength = sizeof(Number32)*3+1+1;
  while(SerialUSB.available() >= 6+expectedPayloadLength) {
    if(SerialUSB.read() != 'S' ||
       SerialUSB.read() != 'Y' ||
       SerialUSB.read() != 'N' ||
       SerialUSB.read() != 'C' ||
       SerialUSB.read() != expectedPayloadLength)
      continue;
    inChecksum = 0;
    unsigned char controlMethod = receiveInt8();
    unsigned char pantoIndex = receiveInt8();
    float values[] = {receiveNumber32().f, receiveNumber32().f, receiveNumber32().f};
    unsigned char checksum = SerialUSB.read();
    if(checksum != inChecksum)
      continue;
    //TODO: maybe turn this into a lookup table
    switch(controlMethod) {
      case 0:
        serialCommandPosition(pantoIndex, values);
        break;
      case 1:
        serialCommandForce(pantoIndex, values);
        break;
      case 2:
        serialCommandPID(pantoIndex, values);
        break;
    }
  }
  
  for(unsigned char i = 0; i < pantoCount; ++i) {
    pantos[i].readEncoders();
    pantos[i].forwardKinematics();
  }

  // Send config hash
  if(heartbeatCountdown-- == 0) {
    heartbeatCountdown = 1024;
    outChecksum = 0;
    SerialUSB.write("SYNC");
    SerialUSB.write(sizeof(configHash));
    SerialUSB.write(configHash, sizeof(configHash));
    for(unsigned char i = 0; i < sizeof(configHash); ++i)
      outChecksum ^= configHash[i];
    SerialUSB.write(outChecksum);
  }

  // Send encoder angles
  outChecksum = 0;
  SerialUSB.write("SYNC");
  SerialUSB.write(sizeof(Number32)*(3*pantoCount));
  for(unsigned char i = 0; i < pantoCount; ++i) {
    sendNumber32(pantos[i].handle.x);
    sendNumber32(pantos[i].handle.y);
    sendNumber32(pantos[i].pointingAngle);
  }
  SerialUSB.write(outChecksum);

  unsigned long now = micros();
  dt = now-prevTime;
  prevTime = now;
  for(unsigned char i = 0; i < pantoCount; ++i)
    pantos[i].actuateMotors();
}
