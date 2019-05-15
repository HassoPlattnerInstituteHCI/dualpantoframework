#include "panto.hpp"
#include <vector>

#include "serial.hpp"

float Panto::s_dt = 0;
std::vector<Panto> pantos;

void Panto::forwardKinematics()
{
    // base angles
    const auto leftBaseAngle = m_actuationAngle[c_localLeftIndex];
    const auto rightBaseAngle = m_actuationAngle[c_localRightIndex];
    const auto handleAngle = m_actuationAngle[c_localHandleIndex];

    // base angle sin / cos
    const auto leftBaseAngleSin = std::sin(leftBaseAngle);
    const auto leftBaseAngleCos = std::cos(leftBaseAngle);

    // calculate inner positions
    const auto leftInnerX =
        fma(leftBaseAngleCos, c_leftInnerLength, c_leftBaseX);
    const auto leftInnerY =
        fma(leftBaseAngleSin, c_leftInnerLength, c_leftBaseY);
    const auto rightInnerX =
        fma(std::cos(rightBaseAngle), c_rightInnerLength, c_rightBaseX);
    const auto rightInnerY =
        fma(std::sin(rightBaseAngle), c_rightInnerLength, c_rightBaseY);

    // diagonal between inner positions
    const auto diagonalX = rightInnerX - leftInnerX;
    const auto diagonalY = rightInnerY - leftInnerY;
    const auto diagonalSquared = diagonalX * diagonalX + diagonalY * diagonalY;
    const auto diagonalLength = std::sqrt(diagonalSquared);

    // left elbow angles 
    // - inside is between diagonal and linkage
    // - offset is between zero and diagonal
    // - total is between zero and linkage
    const auto leftElbowInsideAngleCos =
        (diagonalSquared +
        c_leftOuterLengthSquaredMinusRightOuterLengthSquared) /
        (2 * diagonalLength * c_leftOuterLength);
    const auto leftElbowInsideAngle = -std::acos(leftElbowInsideAngleCos);
    const auto leftElbowOffsetAngle = std::atan2(diagonalY, diagonalX);
    const auto leftElbowTotalAngle =
        leftElbowInsideAngle + leftElbowOffsetAngle;

    // left elbow angle sin / cos
    const auto leftElbowInsideAngleSin =
        std::sin(leftElbowInsideAngle);

    // handle position
    m_handleX =
        fma(std::cos(leftElbowTotalAngle), c_leftOuterLength, leftInnerX);
    m_handleY =
        fma(std::sin(leftElbowTotalAngle), c_leftOuterLength, leftInnerY);

    // right elbow angles
    const auto rightDiffX = m_handleX - rightInnerX;
    const auto rightDiffY = m_handleY - rightInnerY;
    const auto rightElbowInsideAngle = std::atan2(rightDiffY, rightDiffX);

    // store angles
    m_leftInnerAngle = leftElbowInsideAngle;
    m_rightInnerAngle = rightElbowInsideAngle;
    m_pointingAngle =
        handleAngle +
        (c_handleMountedOnRightArm ?
        rightElbowInsideAngle :
        leftElbowInsideAngle);

    // some weird diffs and their sinuses
    const auto rightElbowInsideAngleMinusLeftBaseAngle =
        rightElbowInsideAngle - leftBaseAngle;
    const auto rightElbowInsideAngleMinusLeftBaseAngleSin =
        std::sin(rightElbowInsideAngleMinusLeftBaseAngle);
    const auto rightElbowInsideAngleMinusRightBaseAngle =
        rightElbowInsideAngle - rightBaseAngle;
    const auto rightElbowInsideAngleMinusRightBaseAngleSin =
        std::sin(rightElbowInsideAngleMinusRightBaseAngle);
    const auto leftElbowInsideAngleMinusRightElbowInsideAngle =
        leftElbowInsideAngle - rightElbowInsideAngle;
    const auto leftElbowInsideAngleMinusRightElbowInsideAngleSin =
        std::sin(leftElbowInsideAngleMinusRightElbowInsideAngle);

    // i have given up
    const auto jacobianTemp1 =
        c_leftInnerLength * rightElbowInsideAngleMinusLeftBaseAngleSin;
    const auto forSomeReasonAllCellsAreDividedByThis =
        leftElbowInsideAngleMinusRightElbowInsideAngleSin;

    const auto lowerRowSharedFactor =
        c_rightInnerLength * rightElbowInsideAngleMinusRightBaseAngleSin;

    // jacobian cell 00
    m_jacobian[0][0] =
        (-c_leftInnerLength *
        leftBaseAngleSin) -
        (c_leftInnerLength *
        rightElbowInsideAngleMinusLeftBaseAngleSin *
        leftElbowInsideAngleSin /
        leftElbowInsideAngleMinusRightElbowInsideAngleSin);

    // jacobian cell 01
    m_jacobian[0][1] =
        (c_leftInnerLength *
        leftBaseAngleCos) -
        (c_leftInnerLength *
        rightElbowInsideAngleMinusLeftBaseAngleSin *
        leftElbowInsideAngleCos /
        leftElbowInsideAngleMinusRightElbowInsideAngleSin);

    // jacobian cell 10
    m_jacobian[1][0] =
        lowerRowSharedFactor *
        leftElbowInsideAngleSin /
        leftElbowInsideAngleMinusRightElbowInsideAngleSin;

    // jacobian cell 11
    m_jacobian[1][1] =
        -lowerRowSharedFactor *
        leftElbowInsideAngleCos /
        leftElbowInsideAngleMinusRightElbowInsideAngleSin;
}

void Panto::inverseKinematics()
{
    if (isnan(m_targetX) || isnan(m_targetY))
    {
        m_targetAngle[c_localLeftIndex] = NAN;
        m_targetAngle[c_localRightIndex] = NAN;
    }
    else if (m_isforceRendering)
    {
        m_targetAngle[c_localLeftIndex] =
            m_jacobian[0][0] * m_targetX +
            m_jacobian[0][1] * m_targetY;
        m_targetAngle[c_localRightIndex] =
            m_jacobian[1][0] * m_targetX +
            m_jacobian[1][1] * m_targetY;
    }
    else
    {
        const auto leftBaseToTargetX = m_targetX - c_leftBaseX;
        const auto leftBaseToTargetY = m_targetY - c_leftBaseY;
        const auto rightBaseToTargetX = m_targetX - c_rightBaseX;
        const auto rightBaseToTargetY = m_targetY - c_rightBaseY;
        const auto leftBaseToTargetSquared =
            leftBaseToTargetX * leftBaseToTargetX +
            leftBaseToTargetY * leftBaseToTargetY;
        const auto rightBaseToTargetSquared =
            rightBaseToTargetX * rightBaseToTargetX +
            rightBaseToTargetY * rightBaseToTargetY;
        const auto leftBaseToTargetLength =
            std::sqrt(leftBaseToTargetSquared);
        const auto rightBaseToTargetLength =
            std::sqrt(rightBaseToTargetSquared);

        const auto leftInnerAngleCos =
            (leftBaseToTargetSquared +
            c_leftInnerLengthSquaredMinusLeftOuterLengthSquared) /
            (c_leftInnerLengthDoubled * leftBaseToTargetLength);
        const auto rightInnerAngleCos =
            (rightBaseToTargetSquared +
            c_rightInnerLengthSquaredMinusRightOuterLengthSquared) /
            (c_rightInnerLengthDoubled * rightBaseToTargetLength);
        const auto leftInnerAngle = std::acos(leftInnerAngleCos);
        const auto rightInnerAngle = std::acos(rightInnerAngleCos);
        const auto leftOffsetAngle =
            std::atan2(leftBaseToTargetY, leftBaseToTargetX);
        const auto rightOffsetAngle =
            std::atan2(rightBaseToTargetY, rightBaseToTargetX);

        const auto leftAngle = leftOffsetAngle - leftInnerAngle;
        const auto rightAngle = rightOffsetAngle + rightInnerAngle;

        m_targetAngle[c_localLeftIndex] = leftAngle;
        m_targetAngle[c_localRightIndex] = rightAngle;
    }
};

void Panto::setMotor(uint8_t localIndex, bool dir, float power)
{
    const auto globalIndex = c_globalIndexOffset + localIndex;
    if (motorFlipped[globalIndex])
    {
        dir = !dir;
    }

    digitalWrite(motorDirAPin[globalIndex], dir);
    digitalWrite(motorDirBPin[globalIndex], !dir);
    if (motorPwmPin[globalIndex] != dummyPin)
    {
        power = min(power, motorPowerLimit[globalIndex]);
        if (power < motorPowerLimit[globalIndex])
        {
            m_engagedTime[localIndex] = 0;
        }
        else if (++m_engagedTime[localIndex] >= 36000)
        {
            disengageMotors();
            while (true)
            {
            }
        }
        ledcWrite(globalIndex, power * PWM_MAX);
    }
};

void Panto::readEncoders()
{
    #ifdef LINKAGE_ENCODER_USE_SPI
    for (auto localIndex = 0; localIndex < c_dofCount - 1; ++localIndex)
    {
        const auto globalIndex = c_globalIndexOffset + localIndex;
        m_actuationAngle[localIndex] =
            encoderFlipped[globalIndex] *
            TWO_PI * m_angleAccessors[localIndex]() /
            encoderSteps[globalIndex];
    }
    m_actuationAngle[c_localHandleIndex] =
        (m_encoder[c_localHandleIndex]) ? 
        (encoderFlipped[c_globalHandleIndex] *
        TWO_PI * m_encoder[c_localHandleIndex]->read() /
        encoderSteps[c_globalHandleIndex]) :
        NAN;
    #else
    for (auto localIndex = 0; localIndex < c_dofCount; ++localIndex)
    {
        const auto globalIndex = c_globalIndexOffset + localIndex;
        m_actuationAngle[localIndex] =
            (m_encoder[localIndex]) ?
            (encoderFlipped[globalIndex] *
            TWO_PI * m_encoder[localIndex]->read() /
            encoderSteps[globalIndex]) :
            NAN;
    }
    #endif

    m_actuationAngle[c_localHandleIndex] =
        fmod(m_actuationAngle[c_localHandleIndex], TWO_PI);
};

void Panto::actuateMotors()
{
    for (auto localIndex = 0; localIndex < c_dofCount; ++localIndex)
    {
        if (isnan(m_targetAngle[localIndex]))
        {
            setMotor(localIndex, false, 0);
        }
        else if (m_isforceRendering)
        {
            setMotor(
                localIndex,
                m_targetAngle[localIndex] < 0,
                fabs(m_targetAngle[localIndex]) * forceFactor);
        }
        else
        {
            const auto border = HALF_PI;
            if (m_actuationAngle[localIndex] < border &&
                border < m_targetAngle[localIndex])
            {
                m_actuationAngle[localIndex] += TWO_PI;
            }
            else if (m_actuationAngle[localIndex] > border &&
                border > m_targetAngle[localIndex])
            {
                m_targetAngle[localIndex] += TWO_PI;
            }
            auto error =
                m_targetAngle[localIndex] - m_actuationAngle[localIndex];
            if (localIndex == c_localHandleIndex)
            { // Linkage offsets handle
                error -=
                    c_handleMountedOnRightArm ?
                    m_rightInnerAngle :
                    m_leftInnerAngle;
                if (error > PI)
                {
                    error -= TWO_PI;
                }
                else if (error < -PI)
                {
                    error += TWO_PI;
                }
            }
            auto dir = error < 0;
            error = fabs(error);
            // Power: PID
            m_integral[localIndex] += error * s_dt;
            float derivative = (error - m_previousDiff[localIndex]) / s_dt;
            m_previousDiff[localIndex] = error;
            const auto globalIndex = c_globalIndexOffset + localIndex;
            const auto& pid = pidFactor[globalIndex];
            setMotor(
                localIndex,
                dir,
                pid[0] * error +
                pid[1] * m_integral[localIndex] +
                pid[2] * derivative);
        }
    }
};

void Panto::disengageMotors()
{
    for (auto localIndex = 0; localIndex < c_dofCount; ++localIndex)
    {
        m_targetAngle[localIndex] = NAN;
        setMotor(localIndex, false, 0);
    }
    m_targetX = NAN;
    m_targetY = NAN;
};

Panto::Panto(uint8_t pantoIndex)
: c_pantoIndex(pantoIndex)
, c_globalIndexOffset(c_pantoIndex * c_dofCount)
, c_globalLeftIndex(c_globalIndexOffset + c_localLeftIndex)
, c_globalRightIndex(c_globalIndexOffset + c_localLeftIndex)
, c_globalHandleIndex(c_globalIndexOffset + c_localHandleIndex)
, c_leftInnerLength(linkageInnerLength[c_globalLeftIndex])
, c_rightInnerLength(linkageInnerLength[c_globalRightIndex])
, c_leftOuterLength(linkageOuterLength[c_globalLeftIndex])
, c_rightOuterLength(linkageOuterLength[c_globalRightIndex])
, c_leftInnerLengthDoubled(2 * c_leftInnerLength)
, c_rightInnerLengthDoubled(2 * c_rightInnerLength)
, c_leftInnerLengthSquared(c_leftInnerLength * c_leftInnerLength)
, c_rightInnerLengthSquared(c_rightInnerLength * c_rightInnerLength)
, c_leftOuterLengthSquared(c_leftOuterLength * c_leftOuterLength)
, c_rightOuterLengthSquared(c_rightOuterLength * c_rightOuterLength)
, c_leftInnerLengthSquaredMinusLeftOuterLengthSquared(
    c_leftInnerLengthSquared - c_leftOuterLengthSquared)
, c_rightInnerLengthSquaredMinusRightOuterLengthSquared(
    c_rightInnerLengthSquared - c_rightOuterLengthSquared)
, c_leftOuterLengthSquaredMinusRightOuterLengthSquared(
    c_leftOuterLengthSquared - c_rightOuterLengthSquared)
, c_handleMountedOnRightArm(linkageHandleMount[c_globalHandleIndex] == 1)
, c_leftBaseX(linkageBaseX[c_globalLeftIndex])
, c_leftBaseY(linkageBaseY[c_globalRightIndex])
, c_rightBaseX(linkageBaseX[c_globalLeftIndex])
, c_rightBaseY(linkageBaseY[c_globalRightIndex])
{
    m_targetX = NAN;
    m_targetY = NAN;
    for (auto localIndex = 0; localIndex < c_dofCount; ++localIndex)
    {
        const auto globalIndex = c_globalIndexOffset + localIndex;
        m_actuationAngle[localIndex] = setupAngle[globalIndex] * TWO_PI;
        m_targetAngle[localIndex] = NAN;
        m_previousDiff[localIndex] = 0.0;
        m_integral[localIndex] = 0.0;
        if (encoderAPin[globalIndex] != dummyPin &&
            encoderBPin[globalIndex] != dummyPin)
        {
            m_encoder[localIndex] = new Encoder(
                encoderAPin[globalIndex], encoderBPin[globalIndex]);
        }
        else
        {
            m_encoder[localIndex] = NULL;
        }

        // we don't need additional checks aroud these - if the dummyPin is set properly, the ESP lib will check this anyway
        pinMode(encoderIndexPin[globalIndex], INPUT);
        pinMode(motorDirAPin[globalIndex], OUTPUT);
        pinMode(motorDirBPin[globalIndex], OUTPUT);
        pinMode(motorPwmPin[globalIndex], OUTPUT);

        ledcSetup(globalIndex, c_ledcFrequency, c_ledcResolution);
        ledcAttachPin(motorPwmPin[globalIndex], globalIndex);

        // TODO: Calibration
        // Use encoder index pin and actuate the motors to reach it
        setMotor(localIndex, false, 0);
    }
};

void Panto::calibrationEnd()
{
    for (auto localIndex = 0; localIndex < 3; ++localIndex)
    {
        if (m_encoder[localIndex])
        {
            const auto globalIndex = c_globalIndexOffset + localIndex;
            m_encoder[localIndex]->write(
                m_actuationAngle[localIndex] /
                (TWO_PI) *
                encoderSteps[globalIndex]);
        }
    }
};

void Panto::setDeltaTime(const float dt)
{
    s_dt = dt;
}

float Panto::getActuationAngle(const uint8_t localIndex) const
{
    return m_actuationAngle[localIndex];
};

Vector2D Panto::getPosition() const
{
    return Vector2D(m_handleX, m_handleY);
};

float Panto::getRotation() const
{
    return m_pointingAngle;
};

void Panto::setAngleAccessor(
    const uint8_t localIndex,
    const std::function<uint32_t()> accessor)
{
    m_angleAccessors[localIndex] = accessor;
};

void Panto::setTarget(const Vector2D target, const bool isForceRendering)
{
    m_isforceRendering = isForceRendering;
    m_targetX = target.x;
    m_targetY = target.y;
    inverseKinematics();
};

void Panto::setRotation(const float rotation)
{
    m_targetAngle[c_localHandleIndex] = rotation;
};
