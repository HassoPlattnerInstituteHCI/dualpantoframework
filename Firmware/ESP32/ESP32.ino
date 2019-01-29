#include "panto.hpp"
#include "serial.hpp"

#define SERIALTEST

unsigned long prevTime, heartbeatCountdown = 0;

void setup() {
  Serial.begin(115200);

  // https://forum.arduino.cc/index.php?topic=367154.0
  // http://playground.arduino.cc/Main/TimerPWMCheatsheet

  #ifdef SERIALTEST
  DPSerial::testSend();
  #else
  for(unsigned char i = 0; i < pantoCount; ++i)
    pantos[i].setup(i);
  delay(1000);
  for(unsigned char i = 0; i < pantoCount; ++i)
    pantos[i].calibrationEnd();

  prevTime = micros();
  #endif
}

void loop() {
  #ifdef SERIALTEST

  #else
  // Receive motor commands
  const unsigned char expectedPayloadLength = sizeof(Number32)*3+1+1;
  while(Serial.available() >= 6+expectedPayloadLength) {
    if(Serial.read() != 'S' ||
       Serial.read() != 'Y' ||
       Serial.read() != 'N' ||
       Serial.read() != 'C' ||
       Serial.read() != expectedPayloadLength)
      continue;
    inChecksum = 0;
    unsigned char controlMethod = receiveInt8();
    unsigned char pantoIndex = receiveInt8();
    float values[] = {receiveNumber32().f, receiveNumber32().f, receiveNumber32().f};
    unsigned char checksum = Serial.read();
    if(checksum != inChecksum)
      continue;
    if(controlMethod < 2 && pantoIndex < pantoCount) {
      pantos[pantoIndex].isforceRendering = (controlMethod == 1);
      pantos[pantoIndex].target = Vector2D(values[0], values[1]);
      pantos[pantoIndex].targetAngle[2] = values[2];
      pantos[pantoIndex].inverseKinematics();
    } else if(controlMethod == 2 && pantoIndex < pantoCount*3) {
      for(unsigned char i = 0; i < 3; ++i)
        pidFactor[pantoIndex][i] = values[i];
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
    Serial.write("SYNC");
    Serial.write((unsigned long)sizeof(configHash));
    Serial.write(configHash, sizeof(configHash));
    for(unsigned char i = 0; i < sizeof(configHash); ++i)
      outChecksum ^= configHash[i];
    Serial.write(outChecksum);
  }

  // Send encoder angles
  outChecksum = 0;
  Serial.write("SYNC");
  Serial.write((unsigned long)sizeof(Number32)*(3*pantoCount));
  for(unsigned char i = 0; i < pantoCount; ++i) {
    sendNumber32(pantos[i].handle.x);
    sendNumber32(pantos[i].handle.y);
    sendNumber32(pantos[i].pointingAngle);
  }
  Serial.write(outChecksum);

  unsigned long now = micros();
  dt = now-prevTime;
  prevTime = now;
  for(unsigned char i = 0; i < pantoCount; ++i)
    pantos[i].actuateMotors();
  #endif
}
