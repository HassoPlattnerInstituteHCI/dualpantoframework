#include <Encoder.h>
#include <string.h>

#define OUTPUT_POWER_LIMIT 0.1 // 10%
#define PWM_MAX 4095 // (2^12)-1

// PID
#define P_FACTOR 1
#define I_FACTOR 1
#define D_FACTOR 1

// All Pantos: J2, J3, J4, J5, ME, IT
const unsigned char pwmPin[] = {
  8, 9, 7, 6, 5, 4
};
const unsigned char dirPin[] = {
  22, 26, 30, 34, 38, 42
};
const unsigned char encoderAPin[] = {
  24, 28, 32, 36, 40, 44
};
const unsigned char encoderBPin[] = {
  25, 29, 33, 37, 41, 45
};
/* Haply / Small Panto
const unsigned char flipMotor[] = {
  0, 1, 1, 0, 0, 1
};
const unsigned char flipEncoder[] = {
  0, 0, 1, 1, 0, 1
};*/
// Big Panto
const unsigned char flipMotor[] = {
  0, 0, 1, 1, 0, 1
};
const unsigned char flipEncoder[] = {
  0, 0, 1, 1, 0, 1
};

const unsigned char dof = 6;
unsigned long prevTime;
Encoder* encoder[dof];
int32_t angle[dof], target[dof], force[dof], previousDiff[dof];
float integral[dof];
unsigned char inChecksum, outChecksum;

void setup() {
  SerialUSB.begin(0); // Default is 9600
  analogWriteResolution(12);
  for(unsigned char i = 0; i < dof; ++i) {
    angle[i] = 0;
    target[i] = 0;
    force[i] = 0;
    previousDiff[i] = 0;
    integral[i] = 0;
    encoder[i] = new Encoder(encoderAPin[i], encoderBPin[i]);
    pinMode(dirPin[i], OUTPUT);
    pinMode(pwmPin[i], OUTPUT);
    digitalWrite(pwmPin[i], LOW);
  }
  prevTime = micros();
}

void sendInt32(int32_t value) {
  unsigned char buffer[4];
  for(unsigned char i = 0; i < sizeof(buffer); ++i) {
    buffer[i] = (unsigned char)(value>>(i*8));
    outChecksum ^= buffer[i];
  }
  SerialUSB.write(buffer, sizeof(buffer));
}

int32_t receiveInt32() {
  unsigned char buffer[4];
  SerialUSB.readBytes(buffer, sizeof(buffer));
  for(unsigned char i = 0; i < sizeof(buffer); ++i)
    inChecksum ^= buffer[i];
  return buffer[0] | (buffer[1]<<8) | (buffer[2]<<16) | (buffer[3]<<24);
}

void loop() {
  // BEGIN MAGIC: Really strange compiler / optimizer issue:
  angle[4] = target[0];
  angle[5] = target[1];
  // END MAGIC

  // Read and store encoder angles
  for(unsigned char i = 0; i < dof; ++i) {
    angle[i] = encoder[i]->read();
    if(flipEncoder[i])
      angle[i] *= -1;
  }

  // Send encoder angles
  outChecksum = 0;
  SerialUSB.write("SYNC");
  SerialUSB.write(24);
  for(unsigned char i = 0; i < dof; ++i)
    sendInt32(angle[i]);
  SerialUSB.write(outChecksum);
  SerialUSB.flush();

  // Receive motor commands
  char syncBuffer[4];
  while(SerialUSB.available() >= 15) {
    inChecksum = 0;
    SerialUSB.readBytes(syncBuffer, sizeof(syncBuffer));
    unsigned char len = SerialUSB.read();
    if(strcmp(syncBuffer, "SYNC") != 0 || len != 9)
      continue;
    unsigned char i = SerialUSB.read();
    inChecksum ^= i;
    int32_t targetI = receiveInt32(),
            forceI = receiveInt32();
    unsigned char checksum = SerialUSB.read();
    if(checksum == inChecksum) {
      target[i] = targetI;
      force[i] = forceI;
    }
  }

  unsigned long now = micros();
  float dt = now-prevTime;
  prevTime = now;
  for(unsigned char i = 0; i < dof; ++i) {
    int32_t diff = target[i] - angle[i];
    unsigned char dir = diff < 0;
    if(flipMotor[i])
      dir = !dir;
    digitalWrite(dirPin[i], dir);

    /* PID
    integral[i] += diff * dt;
    derivative = (diff - previousDiff[i]) / dt;
    float power = P_FACTOR*diff + I_FACTOR*integral[i] + D_FACTOR*derivative;
    previousDiff[i] = diff;
    */

    // TODO: Implement PID here and take force[i] into account too
    float power = diff*0.01; // P-Factor
    power *= power;
    
    analogWrite(pwmPin[i], min(power, OUTPUT_POWER_LIMIT) * PWM_MAX);
  }

  /*SerialUSB.println("");
  SerialUSB.print(dt);
  SerialUSB.println(" us");*/
}
