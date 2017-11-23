#include <Encoder.h>
#include <string.h>

#define OUTPUT_POWER_LIMIT 0.2 // 20%
#define PWM_MAX 4095 // (2^12)-1

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
};
const int32_t encoderSteps[] = {
  15360, 15360, 15360, 15360, 512, 15360
};
*/
// Big Panto
const unsigned char flipMotor[] = {
  0, 0, 1, 1, 0, 1
};
const unsigned char flipEncoder[] = {
  0, 0, 1, 1, 0, 0
};
const int32_t encoderSteps[] = {
  5540, 5540, 5540, 5540, 512, 15360
};

const unsigned char dof = 6;
unsigned long prevTime;
Encoder* encoder[dof];
float angle[dof], target[dof], previousDiff[dof], integral[dof], pidFactor[3] = { 15.0, 0.0, 0.0 };
unsigned char inChecksum, outChecksum;

void setup() {
  SerialUSB.begin(0); // Default is 9600
  analogWriteResolution(12);

  // https://forum.arduino.cc/index.php?topic=367154.0
  // http://playground.arduino.cc/Main/TimerPWMCheatsheet
  
  for(unsigned char i = 0; i < dof; ++i) {
    angle[i] = 0.0;
    target[i] = 0.0;
    previousDiff[i] = 0.0;
    integral[i] = 0.0;
    encoder[i] = new Encoder(encoderAPin[i], encoderBPin[i]);
    pinMode(dirPin[i], OUTPUT);
    pinMode(pwmPin[i], OUTPUT);
    digitalWrite(pwmPin[i], LOW);
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
  // BEGIN MAGIC: Really strange compiler / optimizer issue:
  // angle[4] = target[0];
  // angle[5] = target[1];
  // END MAGIC

  // Read and store encoder angles
  for(unsigned char i = 0; i < dof; ++i) {
    angle[i] = 2.0 * M_PI * encoder[i]->read() / encoderSteps[i];
    if(flipEncoder[i])
      angle[i] *= -1;
  }

  // Send encoder angles
  outChecksum = 0;
  SerialUSB.write("SYNC");
  SerialUSB.write(4*(dof+3));
  union Number32 aux;
  for(unsigned char i = 0; i < dof; ++i) {
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
  while(SerialUSB.available() >= 15) {
    inChecksum = 0;
    SerialUSB.readBytes(syncBuffer, sizeof(syncBuffer));
    unsigned char len = SerialUSB.read();
    if(strcmp(syncBuffer, "SYNC") != 0 || len != 5)
      continue;
    unsigned char i = SerialUSB.read();
    inChecksum ^= i;
    Number32 value = receiveNumber32();
    unsigned char checksum = SerialUSB.read();
    if(checksum == inChecksum) {
      if(i > dof)
        pidFactor[i-dof] = value.f;
      else
        target[i] = value.f;
    }
  }

  unsigned long now = micros();
  float dt = now-prevTime;
  prevTime = now;
  for(unsigned char i = 0; i < dof; ++i) {
    if(isnan(target[i])) { // target[i] != target[i]
      digitalWrite(pwmPin[i], LOW);
      continue;
    }

    float error = target[i] - angle[i];

    // Direction
    unsigned char dir = error < 0;
    if(flipMotor[i])
      dir = !dir;
    digitalWrite(dirPin[i], dir);
    error = fabs(error);

    // Power: PID
    integral[i] += error * dt;
    float derivative = (error - previousDiff[i]) / dt;
    float power = pidFactor[0]*error + pidFactor[1]*integral[i] + pidFactor[2]*derivative;
    previousDiff[i] = error;
    analogWrite(pwmPin[i], min(power, OUTPUT_POWER_LIMIT) * PWM_MAX);
  }

  /*SerialUSB.println("");
  SerialUSB.print(dt);
  SerialUSB.println(" us");*/
}
