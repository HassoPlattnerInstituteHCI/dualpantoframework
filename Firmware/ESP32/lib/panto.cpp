#include "panto.hpp"
#include <vector>

#include "serial.hpp"

float Panto::s_dt = 0;
std::vector<Panto> pantos;

void Panto::forwardKinematics()
{
    // base angles
    const auto leftBaseAngle = m_actuationAngle[0];
    const auto rightBaseAngle = m_actuationAngle[1];
    const auto handleAngle = m_actuationAngle[2];

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
    m_innerAngle[0] = leftElbowInsideAngle;
    m_innerAngle[1] = rightElbowInsideAngle;
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
        m_targetAngle[0] = NAN;
        m_targetAngle[1] = NAN;
    }
    else if (m_isforceRendering)
    {
        m_targetAngle[0] =
            m_jacobian[0][0] * m_targetX +
            m_jacobian[0][1] * m_targetY;
        m_targetAngle[1] =
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

        m_targetAngle[0] = leftAngle;
        m_targetAngle[1] = rightAngle;
    }
};

void Panto::setMotor(unsigned char i, bool dir, float power)
{
    const auto index = c_dofIndex + i;
    if (motorFlipped[index])
    {
        dir = !dir;
    }

    digitalWrite(motorDirAPin[index], dir);
    digitalWrite(motorDirBPin[index], !dir);
    if (motorPwmPin[index] != dummyPin)
    {
        power = min(power, motorPowerLimit[index]);
        if (power < motorPowerLimit[index])
        {
            m_engagedTime[i] = 0;
        }
        else if (++m_engagedTime[i] >= 36000)
        {
            disengageMotors();
            while (true)
            {
            }
        }
        ledcWrite(index, power * PWM_MAX);
    }
};

void Panto::readEncoders()
{
    #ifdef LINKAGE_ENCODER_USE_SPI
    for (auto i = 0; i < 2; ++i)
    {
        m_actuationAngle[i] =
            encoderFlipped[c_dofIndex + i] *
            TWO_PI * m_angleAccessors[i]() /
            encoderSteps[c_dofIndex + i];
    }
    m_actuationAngle[2] =
        (m_encoder[2]) ? 
        (encoderFlipped[c_dofIndex + 2] *
        TWO_PI * m_encoder[2]->read() /
        encoderSteps[c_dofIndex + 2]) :
        NAN;
    #else
    for (auto i = 0; i < 3; ++i)
    {
        m_actuationAngle[i] =
            (m_encoder[i]) ?
            (encoderFlipped[c_dofIndex + i] *
            TWO_PI * m_encoder[i]->read() /
            encoderSteps[c_dofIndex + i]) :
            NAN;
    }
    #endif
    
    m_actuationAngle[2] = fmod(m_actuationAngle[2], TWO_PI);
};

void Panto::actuateMotors()
{
    for (auto i = 0; i < 3; ++i)
    {
        const auto targetAngle = m_targetAngle[i];
        if (isnan(targetAngle))
        {
            setMotor(i, false, 0);
        }
        else if (m_isforceRendering)
        {
            setMotor(i, targetAngle < 0, fabs(targetAngle) * forceFactor);
        }
        else
        {
            const auto border = HALF_PI;
            const auto actuationAngle = m_actuationAngle[i];
            if (actuationAngle < border && border < targetAngle)
            {
                m_actuationAngle[i] += TWO_PI;
            }
            else if (actuationAngle > border && border > targetAngle)
            {
                m_targetAngle[i] += TWO_PI;
            }
            auto error = targetAngle - m_actuationAngle[i];
            if (i == 2)
            { // Linkage offsets handle
                error -= m_innerAngle[c_handleMountIndex];
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
            m_integral[i] += error * s_dt;
            float derivative = (error - m_previousDiff[i]) / s_dt;
            m_previousDiff[i] = error;
            setMotor(
                i,
                dir,
                pidFactor[c_dofIndex + i][0] * error +
                pidFactor[c_dofIndex + i][1] * m_integral[i] +
                pidFactor[c_dofIndex + i][2] * derivative);
        }
    }
};

void Panto::disengageMotors()
{
    for (auto i = 0; i < c_dofCount; ++i)
    {
        m_targetAngle[i] = NAN;
        setMotor(i, false, 0);
    }
    m_targetX = NAN;
    m_targetY = NAN;
};

Panto::Panto(uint8_t pantoIndex)
: c_dofIndex(pantoIndex * 3)
, c_leftIndex(c_dofIndex)
, c_rightIndex(c_dofIndex + 1)
, c_handleIndex(c_dofIndex + 2)
, c_leftInnerLength(linkageInnerLength[c_leftIndex])
, c_rightInnerLength(linkageInnerLength[c_rightIndex])
, c_leftOuterLength(linkageOuterLength[c_leftIndex])
, c_rightOuterLength(linkageOuterLength[c_rightIndex])
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
, c_handleMountIndex(linkageHandleMount[c_handleIndex])
, c_handleMountedOnRightArm(c_handleMountIndex == 1)
, c_leftBaseX(linkageBaseX[c_leftIndex])
, c_leftBaseY(linkageBaseY[c_leftIndex])
, c_rightBaseX(linkageBaseX[c_rightIndex])
, c_rightBaseY(linkageBaseY[c_rightIndex])
{
    m_targetX = NAN;
    m_targetY = NAN;
    for (auto i = 0; i < 3; ++i)
    {
        const auto index = c_dofIndex + i;
        m_actuationAngle[i] = setupAngle[index] * TWO_PI;
        m_targetAngle[i] = NAN;
        m_previousDiff[i] = 0.0;
        m_integral[i] = 0.0;
        if (encoderAPin[index] != dummyPin && encoderBPin[index] != dummyPin)
        {
            m_encoder[i] = new Encoder(encoderAPin[index], encoderBPin[index]);
        }
        else
        {
            m_encoder[i] = NULL;
        }

        // we don't need additional checks aroud these - if the dummyPin is set properly, the ESP lib will check this anyway
        pinMode(encoderIndexPin[index], INPUT);
        pinMode(motorDirAPin[index], OUTPUT);
        pinMode(motorDirBPin[index], OUTPUT);
        pinMode(motorPwmPin[index], OUTPUT);

        ledcSetup(index, c_ledcFrequency, c_ledcResolution);
        ledcAttachPin(motorPwmPin[index], index);

        // TODO: Calibration
        // Use encoder index pin and actuate the motors to reach it
        setMotor(i, false, 0);
    }
};

void Panto::calibrationEnd()
{
    for (auto i = 0; i < 3; ++i)
    {
        if (m_encoder[i])
        {
            m_encoder[i]->write(
                m_actuationAngle[i] /
                (TWO_PI) *
                encoderSteps[c_dofIndex + i]);
        }
    }
};

void Panto::setDeltaTime(const float dt)
{
    s_dt = dt;
}

float Panto::getActuationAngle(const uint8_t index) const
{
    return m_actuationAngle[index];
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
    const uint8_t index,
    const std::function<uint32_t()> accessor)
{
    m_angleAccessors[index] = accessor;
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
    m_targetAngle[c_handleIndex] = rotation;
};
