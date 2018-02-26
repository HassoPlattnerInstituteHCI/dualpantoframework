#include <Encoder.h>
#include "config.h"
#include "utils.h"

#define PWM_MAX 4095 // (2^12)-1

const unsigned char dofCount = pantoCount*3;
Encoder* encoder[dofCount];
float dt, destinationAngle[dofCount], previousDiff[dofCount], integral[dofCount], pidFactor[3] = { 5.0, 0.0, 0.0 };

struct Panto {
  unsigned char dofIndex;
  float innerAngle[2], pointingAngle;
  Vector2D base[2], inner[2], handle, target;

  Panto() {
    base[0] = Vector2D(-0.5*baseDist, 0);
    base[1] = Vector2D(+0.5*baseDist, 0);
  }

  void forwardKinematics() {
    inner[0] = base[0]+Vector2D::fromPolar(actuationAngle[dofIndex+0], linkageInnerDist[dofIndex+0]);
    inner[1] = base[1]+Vector2D::fromPolar(actuationAngle[dofIndex+1], linkageInnerDist[dofIndex+1]);
    Vector2D diagonal = inner[1]-inner[0];
    // TODO: Asymmetric linkage lengths
    innerAngle[0] = diagonal.angle()-acos(diagonal.length()*0.5/linkageOuterDist[dofIndex+0]);
    handle = Vector2D::fromPolar(innerAngle[0], linkageOuterDist[dofIndex+0])+inner[0];
    innerAngle[1] = (handle-inner[1]).angle();
    pointingAngle = actuationAngle[dofIndex+2]+innerAngle[1];
  }

  void inverseKinematicsHelper(float inverted, float diff, float factor, float threshold=0.001) {
    diff *= factor;
    if(fabs(diff) < threshold)
      return;
    actuationAngle[dofIndex+0] += diff;
    actuationAngle[dofIndex+1] += diff*inverted;
  }

  void inverseKinematics() {
    if(isnan(target.x) || isnan(target.y)) {
      destinationAngle[dofIndex+0] = NAN;
      destinationAngle[dofIndex+1] = NAN;
      return;
    }
    const unsigned int iterations = 10;
    float targetAngle = clamp(target.angle(), (-M_PI-opAngle)*0.5, (-M_PI+opAngle)*0.5),
          targetRadius = clamp(target.length(), opMinDist, opMaxDist),
          savedActuationAngle[] = {actuationAngle[dofIndex+0], actuationAngle[dofIndex+1]};
    for(unsigned int i = 0; i < iterations; ++i) {
      forwardKinematics();
      float currentAngle = handle.angle(),
            currentRadius = handle.length();
      inverseKinematicsHelper(+1, targetAngle-currentAngle, 0.5);
      inverseKinematicsHelper(-1, targetRadius-currentRadius, 0.002);
    }
    destinationAngle[dofIndex+0] = actuationAngle[dofIndex+0];
    destinationAngle[dofIndex+1] = actuationAngle[dofIndex+1];
    actuationAngle[dofIndex+0] = savedActuationAngle[dofIndex+0];
    actuationAngle[dofIndex+1] = savedActuationAngle[dofIndex+1];
  }

  void setMotor(unsigned char i, bool dir, float power) {
    digitalWrite(motorDirAPin[i], dir);
    if(motorDirBPin[i])
      digitalWrite(motorDirBPin[i], !dir);
    analogWrite(motorPwmPin[i], min(power, powerLimit) * PWM_MAX);
  }

  void setup(unsigned char _dofIndex) {
    dofIndex = _dofIndex*3;
    target = Vector2D(NAN, NAN);
    for(unsigned char i = dofIndex; i < dofIndex+3; ++i) {
      actuationAngle[i] *= 2.0 * M_PI;
      destinationAngle[i] = NAN;
      previousDiff[i] = 0.0;
      integral[i] = 0.0;
      encoder[i] = new Encoder(encoderAPin[i], encoderBPin[i]);
      if(encoderIndexPin[i])
        pinMode(encoderIndexPin[i], INPUT);
      pinMode(motorDirAPin[i], OUTPUT);
      if(motorDirBPin[i])
        pinMode(motorDirBPin[i], OUTPUT);
      pinMode(motorPwmPin[i], OUTPUT);

      // TODO: Calibration
      bool dir = (i % 3 == 0);
      if(motorFlipped[i])
        dir = !dir;
      setMotor(i, dir, 0.1);
    }
  }

  // TODO: Use encoder index pin and actuate the motors to reach it
  void calibrationEnd() {
    for(unsigned char i = dofIndex; i < dofIndex+3; ++i) {
      digitalWrite(motorPwmPin[i], LOW);
      encoder[i]->write(actuationAngle[i] / (2.0 * M_PI) * encoderSteps[i] * ((encoderFlipped[i]) ? -1 : 1));
    }
  }

  void readEncoders() {
    for(unsigned char i = dofIndex; i < dofIndex+3; ++i)
      actuationAngle[i] = 2.0 * M_PI * encoder[i]->read() / encoderSteps[i] * ((encoderFlipped[i]) ? -1 : 1);
  }

  void actuateMotors() {
    for(unsigned char i = dofIndex; i < dofIndex+3; ++i) {
      if(isnan(destinationAngle[i])) {
        digitalWrite(motorPwmPin[i], LOW);
        continue;
      }

      float error = destinationAngle[i] - actuationAngle[i];

      // Direction
      unsigned char dir = error < 0;
      if(motorFlipped[i])
        dir = !dir;
      digitalWrite(motorDirAPin[i], dir);
      if(motorDirAPin[i])
        digitalWrite(motorDirBPin[i], !dir);
      error = fabs(error);

      // Power: PID
      integral[i] += error * dt;
      float derivative = (error - previousDiff[i]) / dt;
      previousDiff[i] = error;
      setMotor(i, dir, pidFactor[0]*error + pidFactor[1]*integral[i] + pidFactor[2]*derivative);
    }
  }
} pantos[pantoCount];
