#include <Encoder.h>
#include "config.h"
#include "utils.h"

#define OUTPUT_POWER_LIMIT 0.2 // 20%
#define PWM_MAX 4095 // (2^12)-1

Encoder* encoder[dofCount];
float dt, destinationAngle[dofCount], previousDiff[dofCount], integral[dofCount], pidFactor[3] = { 15.0, 0.0, 0.0 };

struct Panto {
  unsigned char dofIndex;
  float innerAngle[2], pointingAngle;
  Vector2D base[2], inner[2], handle, target;

  Panto() {
    base[0] = Vector2D(-0.5*baseDist, 0);
    base[1] = Vector2D(+0.5*baseDist, 0);
  }

  void forwardKinematics() {
    inner[0] = base[0]+Vector2D::fromPolar(actuationAngle[dofIndex+0], innerDist);
    inner[1] = base[1]+Vector2D::fromPolar(actuationAngle[dofIndex+1], innerDist);
    Vector2D diagonal = inner[1]-inner[0];
    innerAngle[0] = diagonal.angle()-acos(diagonal.length()*0.5/outerDist);
    handle = Vector2D::fromPolar(innerAngle[0], outerDist)+inner[0];
    innerAngle[1] = (handle-inner[1]).angle();
    pointingAngle = actuationAngle[dofIndex+2]+innerAngle[1];
  }

  void inverseKinematicsHelper(float inverted, float diff, float speedFactor, float speedThreshold=0.001) {
    float speed = fabs(diff)*speedFactor;
    if(speed < speedThreshold)
      return;
    if(diff < 0) {
      actuationAngle[dofIndex+0] -= speed;
      actuationAngle[dofIndex+1] += speed*inverted;
    } else {
      actuationAngle[dofIndex+0] += speed;
      actuationAngle[dofIndex+1] -= speed*inverted;
    }
  }

  void inverseKinematics() {
    float savedActuationAngle[] = {actuationAngle[dofIndex+0], actuationAngle[dofIndex+1]};
    const unsigned int iterations = 10;
    float targetAngle = clamp(target.angle(), (-M_PI-opAngle)*0.5, (-M_PI+opAngle)*0.5),
          targetRadius = clamp(target.length(), opMinDist, opMaxDist);
    for(unsigned int i = 0; i < iterations; ++i) {
      forwardKinematics();
      float currentAngle = handle.angle(),
            currentRadius = handle.length();
      inverseKinematicsHelper(-1, targetAngle-currentAngle, 0.5);
      inverseKinematicsHelper(+1, targetRadius-currentRadius, 0.002);
    }
    destinationAngle[dofIndex+0] = actuationAngle[dofIndex+0];
    destinationAngle[dofIndex+1] = actuationAngle[dofIndex+1];
    actuationAngle[dofIndex+0] = savedActuationAngle[dofIndex+0];
    actuationAngle[dofIndex+1] = savedActuationAngle[dofIndex+1];
  }

  void setup(unsigned char _dofIndex) {
    dofIndex = _dofIndex*3;
    target = Vector2D(NAN, NAN);
    for(unsigned char i = dofIndex; i < dofIndex+3; ++i) {
      actuationAngle[i] *= 2.0 * M_PI;
      destinationAngle[i] = actuationAngle[i];
      previousDiff[i] = 0.0;
      integral[i] = 0.0;
      // pinMode(encoderIndexPin[i], INPUT); // TODO
      pinMode(motorDirPin[i], OUTPUT);
      pinMode(motorPwmPin[i], OUTPUT);
      digitalWrite(motorPwmPin[i], LOW);
      encoder[i] = new Encoder(encoderAPin[i], encoderBPin[i]);
      encoder[i]->write(actuationAngle[i] / (2.0 * M_PI) * encoderSteps[i] * ((encoderFlipped[i]) ? -1 : 1));
    }
  }

  void calibration() {
    // TODO: Use encoder index pin and actuate the motors to reach it
  }

  void readEncoders() {
    for(unsigned char i = dofIndex; i < dofIndex+3; ++i)
      actuationAngle[i] = 2.0 * M_PI * encoder[i]->read() / encoderSteps[i] * ((encoderFlipped[i]) ? -1 : 1);
  }

  void actuateMotors() {
    bool active = !isnan(target.x) && !isnan(target.y);
    for(unsigned char i = dofIndex; i < dofIndex+3; ++i) {
      if(!active) {
        digitalWrite(motorPwmPin[i], LOW);
        continue;
      }

      float error = destinationAngle[i] - actuationAngle[i];

      // Direction
      unsigned char dir = error < 0;
      if(motorFlipped[i])
        dir = !dir;
      digitalWrite(motorDirPin[i], dir);
      error = fabs(error);

      // Power: PID
      integral[i] += error * dt;
      float derivative = (error - previousDiff[i]) / dt,
            voltage = pidFactor[0]*error + pidFactor[1]*integral[i] + pidFactor[2]*derivative;
      previousDiff[i] = error;
      error = 0.2;
      analogWrite(motorPwmPin[i], min(voltage, OUTPUT_POWER_LIMIT) * PWM_MAX);
    }
  }
} pantos[pantoCount];
