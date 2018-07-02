#include <Encoder.h>
#include "config.h"
#include "utils.h"

#define PWM_MAX 4095 // (2^12)-1

const unsigned char dofCount = pantoCount*3;
float dt;

struct Panto {
  unsigned char dofIndex;

  Encoder* encoder[3];
  float actuationAngle[3];
  float targetAngle[3];
  float previousDiff[3];
  float integral[3];
  unsigned long engagedTime[3] = {};

  float innerAngle[2], pointingAngle;
  Vector2D base[2], inner[2], handle, target;
  bool isforceRendering = false;
  /* Transpose of Jacobian Matrix
                | J00 J01 |
    Jt(x, t)  = |         |
                | J10 J11 |
  */
  float J[2][2] = {{0.0,0.0}, {0.0,0.0}};

  void forwardKinematics() {
    inner[0] = base[0]+Vector2D::fromPolar(actuationAngle[0], linkageInnerLength[dofIndex+0]);
    inner[1] = base[1]+Vector2D::fromPolar(actuationAngle[1], linkageInnerLength[dofIndex+1]);
    Vector2D diagonal = inner[1]-inner[0];
    // innerAngle[0] = diagonal.angle()-acos(diagonal.length()/(linkageOuterLength[dofIndex+0]+linkageOuterLength[dofIndex+1]));
    innerAngle[0] = diagonal.angle()-acos((diagonal*diagonal+linkageOuterLength[dofIndex+0]*linkageOuterLength[dofIndex+0]-linkageOuterLength[dofIndex+1]*linkageOuterLength[dofIndex+1])/(2 * diagonal.length() * linkageOuterLength[dofIndex+0]));
    handle = Vector2D::fromPolar(innerAngle[0], linkageOuterLength[dofIndex+0])+inner[0];
    innerAngle[1] = (handle-inner[1]).angle();
    pointingAngle = actuationAngle[2]+innerAngle[1];

    J[0][0] = -linkageInnerLength[dofIndex+0] * sin(actuationAngle[0]) -
              (linkageInnerLength[dofIndex+0] * sin(innerAngle[0])*sin(innerAngle[1]-actuationAngle[0]))/(sin(innerAngle[0] - innerAngle[1]));
    J[0][1] =  linkageInnerLength[dofIndex+0] * cos(actuationAngle[0]) +
              (linkageInnerLength[dofIndex+0] * cos(innerAngle[0])*sin(innerAngle[1]-actuationAngle[0]))/(sin(innerAngle[0] - innerAngle[1]));
    J[1][0] = (linkageInnerLength[dofIndex+1] * sin(innerAngle[0])*sin(innerAngle[1]-actuationAngle[1]))/(sin(innerAngle[0] - innerAngle[1]));
    J[1][1] = -(linkageInnerLength[dofIndex+1] * cos(innerAngle[0])*sin(innerAngle[1]-actuationAngle[1]))/(sin(innerAngle[0] - innerAngle[1]));
  }

  void inverseKinematicsHelper(float inverted, float diff, float factor, float threshold=0.001) {
    diff *= factor;
    if(fabs(diff) < threshold)
      return;
    actuationAngle[0] += diff;
    actuationAngle[1] += diff*inverted;
  }

  void inverseKinematics() {
    if(isnan(target.x) || isnan(target.y)) {
      targetAngle[0] = NAN;
      targetAngle[1] = NAN;
      return;
    }
    if(isforceRendering) {
      targetAngle[0] = J[0][0] * target.x + J[0][1] * target.y;
      targetAngle[1] = J[1][0] * target.x + J[1][1] * target.y;
    } else {
      const unsigned int iterations = 10;
      float nextAngle = clamp(target.angle(), (-M_PI-opAngle)*0.5, (-M_PI+opAngle)*0.5),
            nextRadius = clamp(target.length(), opMinDist, opMaxDist),
            savedActuationAngle[] = {actuationAngle[0], actuationAngle[1]};
      for(unsigned int i = 0; i < iterations; ++i) {
        forwardKinematics();
        inverseKinematicsHelper(+1, nextAngle-handle.angle(), 0.5);
        inverseKinematicsHelper(-1, nextRadius-handle.length(), 0.002);
      }
      targetAngle[0] = actuationAngle[0];
      targetAngle[1] = actuationAngle[1];
      actuationAngle[0] = savedActuationAngle[0];
      actuationAngle[1] = savedActuationAngle[1];
    }
  }

  void setMotor(unsigned char i, bool dir, float power) {
    if(motorFlipped[dofIndex+i])
        dir = !dir;
    if(motorDirAPin[dofIndex+i])
      digitalWrite(motorDirAPin[dofIndex+i], dir);
    if(motorDirBPin[dofIndex+i])
      digitalWrite(motorDirBPin[dofIndex+i], !dir);
    if(motorPwmPin[dofIndex+i]) {
      power = min(power, motorPowerLimit[dofIndex+i]);
      if(power < motorPowerLimit[dofIndex+i])
        engagedTime[i] = 0;
      else if(++engagedTime[i] >= 36000) {
        disengageMotors();
        while(1);
      }
      analogWrite(motorPwmPin[dofIndex+i], power*PWM_MAX);
    }
  }

  void setup(unsigned char _dofIndex) {
    dofIndex = _dofIndex*3;
    base[0] = Vector2D(linkageBaseX[dofIndex+0], linkageBaseY[dofIndex+0]);
    base[1] = Vector2D(linkageBaseX[dofIndex+1], linkageBaseY[dofIndex+1]);
    target = Vector2D(NAN, NAN);
    for(unsigned char i = 0; i < 3; ++i) {
      actuationAngle[i] = setupAngle[dofIndex+i] * 2.0 * M_PI;
      targetAngle[i] = NAN;
      previousDiff[i] = 0.0;
      integral[i] = 0.0;
      if(encoderAPin[dofIndex+i] && encoderBPin[dofIndex+i])
        encoder[i] = new Encoder(encoderAPin[dofIndex+i], encoderBPin[dofIndex+i]);
      else
        encoder[i] = NULL;
      if(encoderIndexPin[dofIndex+i])
        pinMode(encoderIndexPin[dofIndex+i], INPUT);
      if(motorDirAPin[dofIndex+i])
        pinMode(motorDirAPin[dofIndex+i], OUTPUT);
      if(motorDirBPin[dofIndex+i])
        pinMode(motorDirBPin[dofIndex+i], OUTPUT);
      if(motorPwmPin[dofIndex+i])
        pinMode(motorPwmPin[dofIndex+i], OUTPUT);

      // TODO: Calibration
      // Use encoder index pin and actuate the motors to reach it
      setMotor(i, false, 0);
    }
  }

  void calibrationEnd() {
    for(unsigned char i = 0; i < 3; ++i) {
      // setMotor(i, false, 0);
      if(encoder[i])
        encoder[i]->write(actuationAngle[i] / (2.0 * M_PI) * encoderSteps[dofIndex+i]);
    }
  }

  void readEncoders() {
    for(unsigned char i = 0; i < 3; ++i)
      actuationAngle[i] = (encoder[i]) ? 2.0 * M_PI * encoder[i]->read() / encoderSteps[dofIndex+i] : NAN;
  }

  void actuateMotors() {
    for(unsigned char i = 0; i < 3; ++i) {
      if(isnan(targetAngle[i])) {
        setMotor(i, false, 0);
        continue;
      }
      if(isforceRendering) {
        setMotor(i, targetAngle[i] < 0, fabs(targetAngle[i])*forceFactor);
      } else {
        float error = targetAngle[i] - actuationAngle[i];
        unsigned char dir = error < 0;
        error = fabs(error);
        // Power: PID
        integral[i] += error * dt;
        float derivative = (error - previousDiff[i]) / dt;
        previousDiff[i] = error;
        setMotor(i, dir, pidFactor[dofIndex+i][0]*error + pidFactor[dofIndex+i][1]*integral[i] + pidFactor[dofIndex+i][2]*derivative);
      }
    }
  }

  void disengageMotors() {
    for(unsigned char i = 0; i < dofCount; ++i) {
      targetAngle[i] = NAN;
      setMotor(i, false, 0);
    }
    target = Vector2D(NAN, NAN);
  }

} pantos[pantoCount];
