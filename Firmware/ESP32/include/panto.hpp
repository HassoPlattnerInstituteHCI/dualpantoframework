#pragma once

#include <Arduino.h>
#include <Encoder.h>
#include <functional>

#include "config.hpp"
#include "utils.hpp"

class Panto
{
private:
    static const uint16_t c_ledcFrequency = 20000;
    static const uint16_t c_ledcResolution = 12;
    static const uint16_t PWM_MAX = 4095; // (2^12)-1
    static const uint8_t c_dofCount = 3;

    static float s_dt;

    const uint8_t c_dofIndex;
    const uint8_t c_leftIndex;
    const uint8_t c_rightIndex;
    const uint8_t c_handleIndex;
    const float c_leftInnerLength;
    const float c_rightInnerLength;
    const float c_leftOuterLength;
    const float c_rightOuterLength;
    const float c_leftInnerLengthDoubled;
    const float c_rightInnerLengthDoubled;
    const float c_leftInnerLengthSquared;
    const float c_rightInnerLengthSquared;
    const float c_leftOuterLengthSquared;
    const float c_rightOuterLengthSquared;
    const float c_leftInnerLengthSquaredMinusLeftOuterLengthSquared;
    const float c_rightInnerLengthSquaredMinusRightOuterLengthSquared;
    const float c_leftOuterLengthSquaredMinusRightOuterLengthSquared;
    const uint8_t c_handleMountIndex;
    const bool c_handleMountedOnRightArm;
    const float c_leftBaseX;
    const float c_leftBaseY;
    const float c_rightBaseX;
    const float c_rightBaseY;

    #ifdef LINKAGE_ENCODER_USE_SPI
    std::function<uint32_t()> m_angleAccessors[2];
    #endif
    Encoder *m_encoder[3];
    float m_actuationAngle[3];
    float m_targetAngle[3];
    float m_previousDiff[3];
    float m_integral[3];
    unsigned long m_engagedTime[3] = {};

    float m_innerAngle[2];
    float m_pointingAngle;
    Vector2D m_inner[2];
    double m_handleX = 0;
    double m_handleY = 0;
    double m_targetX = 0;
    double m_targetY = 0;
    bool m_isforceRendering = false;
    float m_jacobian[2][2] = {{0.0, 0.0}, {0.0, 0.0}};

    void inverseKinematics();
    void setMotor(unsigned char i, bool dir, float power);
    void disengageMotors();
public:
    Panto(uint8_t pantoIndex);
    static void setDeltaTime(const float dt);
    float getActuationAngle(const uint8_t index) const;
    Vector2D getPosition() const;
    float getRotation() const;
    void setAngleAccessor(
        const uint8_t index, const std::function<uint32_t()> accessor);
    void setTarget(const Vector2D target, const bool isForceRendering);
    void setRotation(const float rotation);
    void calibrationEnd();
    void readEncoders();
    void forwardKinematics();
    void actuateMotors();
};

extern std::vector<Panto> pantos;
