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
    float m_previousAngle[c_dofCount];
    float m_previousAngles[c_dofCount][5];
    float m_targetAngle[c_dofCount];
    float m_previousDiff[c_dofCount];
    float m_integral[c_dofCount];
    uint32_t m_prevTime = 0;

    int m_previousAnglesCount = 0;
    int m_encoderErrorCount = 0;
    int m_encoderErrorCounts[4] = {0,0,0,0};
    int m_encoderRequestCount = 0;
    int m_encoderRequestCounts[4] = {0,0,0,0};
    float m_leftInnerAngle = 0;
    float m_rightInnerAngle = 0;
    float m_pointingAngle = 0;
    float m_handleX = 0;
    float m_handleY = 0;
    float m_targetX = 0;
    float m_targetY = 0;
    float m_startX = 0;
    float m_startY = 0;
    float m_filteredX = 0;
    float m_filteredY = 0;
    float m_tweeningValue = 0.0f;
    float m_tweeningStep = 0.00001f;
    float m_tweeningSpeed = 1.0f;
    uint32_t m_tweeningPrevtime = 0;
    float m_dt = 0.0001f;
    float delta = 0.01;
    float velocity = 1.0f;
    bool m_isforceRendering = false;
    bool m_inTransition = false;
    float m_jacobian[2][2] = {{0.0, 0.0}, {0.0, 0.0}};
    bool m_isFrozen = false;
    bool m_isCalibrating = false;

    void inverseKinematics();
    void setMotor(
        const uint8_t& localIndex, const bool& dir, const float& power);
    void disengageMotors();
public:
    Panto(uint8_t pantoIndex);
    float getActuationAngle(const uint8_t index) const;
    Vector2D getPosition() const;
    float getRotation() const;
    void setAngleAccessor(const uint8_t index, const AngleAccessor accessor);
    void setTarget(const Vector2D target, const bool isForceRendering);
    void setSpeed(const float speed);
    void setRotation(const float rotation);
    bool getCalibrationState();
    void calibrateEncoders();
    void calibratePanto();
    void calibrationEnd();
    void resetActuationAngle();
    void readEncoders();
    void forwardKinematics();
    void actuateMotors();
    int getEncoderErrorCount();
    int getEncoderRequests();
    int getEncoderErrorCounts(int i);
    int getEncoderRequestsCounts(int i);
    uint8_t getPantoIndex();
    bool getInTransition();
    void setInTransition(bool inTransition);
    bool getIsFrozen();
    void setIsFrozen(bool isFrozen);
};

extern std::vector<Panto> pantos;