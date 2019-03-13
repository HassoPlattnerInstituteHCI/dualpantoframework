#pragma once

#include <Arduino.h>
#include <Encoder.h>
#include "config.hpp"
#include "utils.hpp"

struct Panto
{
    const int ledcFrequency = 20000;
    const int ledcResolution = 12;
    const int PWM_MAX = 4095; // (2^12)-1

    const unsigned char dofCount = pantoCount * 3;

    static float dt;

    unsigned char dofIndex;

    Encoder *encoder[3];
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
    float J[2][2] = {{0.0, 0.0}, {0.0, 0.0}};

    void forwardKinematics();

    void inverseKinematicsHelper(float inverted, float diff, float factor, float threshold = 0.001);

    void inverseKinematics();

    void setMotor(unsigned char i, bool dir, float power);

    void setup(unsigned char _dofIndex);

    void calibrationEnd();

    void readEncoders();

    void actuateMotors();

    void disengageMotors();

};

extern Panto pantos[pantoCount];
