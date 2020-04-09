#pragma once

#include <Encoder.h>

#include "config/config.hpp"
#include "hardware/angleAccessor.hpp"
#include "utils/vector.hpp"
#include <EEPROM.h>

// make sure results are in range -270° ~ 0° ~ +90°
#define ensureAngleRange(angle) \
    angle > HALF_PI ? \
        angle - TWO_PI : \
    angle < -(PI + HALF_PI) ? \
        angle + TWO_PI : \
        angle

class Panto
{
private:
    static const uint16_t c_ledcFrequency = 20000;
    static const uint16_t c_ledcResolution = 12;
    static const uint16_t PWM_MAX = 4095; // (2^12)-1
    static const uint8_t c_dofCount = 3;
    const uint8_t c_localLeftIndex = 0;
    const uint8_t c_localRightIndex = 1;
    const uint8_t c_localHandleIndex = 2;

    const uint8_t c_pantoIndex;
    const uint8_t c_globalIndexOffset;
    const uint8_t c_globalLeftIndex;
    const uint8_t c_globalRightIndex;
    const uint8_t c_globalHandleIndex;
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
    const bool c_handleMountedOnRightArm;
    const float c_leftBaseX;
    const float c_leftBaseY;
    const float c_rightBaseX;
    const float c_rightBaseY;

    #ifdef LINKAGE_ENCODER_USE_SPI
    AngleAccessor m_angleAccessors[2];
    #endif
    Encoder* m_encoder[c_dofCount];
    float m_actuationAngle[c_dofCount];
    float m_targetAngle[c_dofCount];
    float m_previousDiff[c_dofCount];
    float m_integral[c_dofCount];
    uint32_t m_prevTime = 0;
    uint32_t m_dt = 0.0;

    float m_leftInnerAngle = 0;
    float m_rightInnerAngle = 0;
    float m_pointingAngle = 0;
    float m_handleX = 0;
    float m_handleY = 0;
    float m_targetX = 0;
    float m_targetY = 0;

    float m_startX = 0;
    float m_startY = 0;
    float m_tweenTargetX = 0;
    float m_tweenTargetY = 0;

    float m_tweenDuration = 3.0;

    bool m_isforceRendering = false;
    float m_jacobian[2][2] = {{0.0, 0.0}, {0.0, 0.0}};

    float m_tweenValue = 0.0;

    void inverseKinematics();
    void setMotor(
        const uint8_t& localIndex, const bool& dir, const float& power);
    void disengageMotors();
    float tweenFunc(float t){float sqt = t * t;return sqt / (2.0f * (sqt - t) + 1.0f);}
    float tweenFuncBesier(float t){return constrain(t * t * (3.0f - 2.0f * t), 0.0, 1.0);}
public:
    Panto(uint8_t pantoIndex);
    float getActuationAngle(const uint8_t index) const;
    Vector2D getPosition() const;
    float getRotation() const;
    void setAngleAccessor(const uint8_t index, const AngleAccessor accessor);
    void setTarget(const Vector2D target, const bool isForceRendering);
    void computeTweenTarget(const Vector2D target, const bool isForceRendering);
    void setRotation(const float rotation);
    void calibrateEncoders();
    void calibrationEnd();
    void readEncoders();
    void forwardKinematics();
    void actuateMotors();
    void updateTweenValue();
    void setTweenValue(float value);
    void setTweenSpeed(float v){m_tweenDuration=v;}
};

extern std::vector<Panto> pantos;
