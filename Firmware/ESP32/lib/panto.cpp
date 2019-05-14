#include "panto.hpp"
#include <vector>

#include "serial.hpp"

float Panto::dt = 0;
Panto pantos[pantoCount];

void Panto::forwardKinematics()
{
    // things that should be const for the panto
    const auto leftIndex = dofIndex;
    const auto rightIndex = dofIndex + 1;
    const auto handleIndex = dofIndex + 2;
    const auto leftInnerLength = linkageInnerLength[leftIndex];
    const auto rightInnerLength = linkageInnerLength[rightIndex];
    const auto leftOuterLength = linkageOuterLength[leftIndex];
    const auto rightOuterLength = linkageOuterLength[rightIndex];
    const auto leftOuterLengthSquared = leftOuterLength * leftOuterLength;
    const auto rightOuterLengthSquared = rightOuterLength * rightOuterLength;
    const auto handleMount = linkageHandleMount[handleIndex];
    const auto leftBase = base[leftIndex];
    const auto rightBase = base[rightIndex];
    const auto leftBaseX = leftBase.x;
    const auto leftBaseY = leftBase.y;
    const auto rightBaseX = rightBase.x;
    const auto rightBaseY = rightBase.y;

    // now begins the actual code

    // base angles
    const auto leftBaseAngle = actuationAngle[0];
    const auto rightBaseAngle = actuationAngle[1];
    const auto handleAngle = actuationAngle[2];

    // base angle sin / cos
    const auto leftBaseAngleSin = std::sin(leftBaseAngle);
    const auto leftBaseAngleCos = std::cos(leftBaseAngle);

    // calculate inner positions
    const auto leftInnerX =
        fma(leftBaseAngleCos, leftInnerLength, leftBaseX);
    const auto leftInnerY =
        fma(leftBaseAngleSin, leftInnerLength, leftBaseY);
    const auto rightInnerX =
        fma(std::cos(rightBaseAngle), rightInnerLength, rightBaseX);
    const auto rightInnerY =
        fma(std::sin(rightBaseAngle), rightInnerLength, rightBaseY);
    // if(dofIndex == 0)
    //     DPSerial::sendInstantDebugLog(
    //         "left (%+08.3f|%+08.3f) right (%+08.3f|%+08.3f)",
    //         leftInnerX, leftInnerY, rightInnerX, rightInnerY);
    // return;

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
        (diagonalSquared + leftOuterLengthSquared - rightOuterLengthSquared) /
        (2 * leftOuterLength * diagonalLength);
    const auto leftElbowInsideAngle = -std::acos(leftElbowInsideAngleCos);
    const auto leftElbowOffsetAngle = std::atan2(diagonalY, diagonalX);
    const auto leftElbowTotalAngle =
        leftElbowInsideAngle + leftElbowOffsetAngle;

    // left elbow angle sin / cos
    const auto leftElbowInsideAngleSin =
        std::sin(leftElbowInsideAngle);

    // handle position
    const auto handleX =
        fma(std::cos(leftElbowTotalAngle), leftOuterLength, leftInnerX);
    const auto handleY =
        fma(std::sin(leftElbowTotalAngle), leftOuterLength, leftInnerY);
    
    // if(dofIndex == 0)
    //     DPSerial::sendInstantDebugLog(
    //         "%+08.3f %+08.3f %+08.3f %+08.3f %+08.3f %+08.3f handle (%+08.3f|%+08.3f)",
    //         diagonalX, diagonalY, diagonalLength, degrees(leftElbowInsideAngle), degrees(leftElbowOffsetAngle), degrees(leftElbowTotalAngle), handleX, handleY);
    // return;

    // store handle
    handle.x = handleX;
    handle.y = handleY;

    // right elbow angles
    const auto rightDiffX = handleX - rightInnerX;
    const auto rightDiffY = handleY - rightInnerY;
    const auto rightElbowInsideAngle = std::atan2(rightDiffY, rightDiffX);

    // store angles
    innerAngle[0] = leftElbowInsideAngle;
    innerAngle[1] = rightElbowInsideAngle;
    pointingAngle =
        handleAngle +
        (handleMount ? rightElbowInsideAngle : leftElbowInsideAngle);

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
        leftInnerLength * rightElbowInsideAngleMinusLeftBaseAngleSin;
    const auto forSomeReasonAllCellsAreDividedByThis =
        leftElbowInsideAngleMinusRightElbowInsideAngleSin;

    const auto lowerRowSharedFactor =
        rightInnerLength * rightElbowInsideAngleMinusRightBaseAngleSin;
    //const auto upperRowSharedFactor =


    // jacobian cell 00
    J[0][0] =
        (-leftInnerLength *
        leftBaseAngleSin) -
        (leftInnerLength *
        rightElbowInsideAngleMinusLeftBaseAngleSin *
        leftElbowInsideAngleSin /
        leftElbowInsideAngleMinusRightElbowInsideAngleSin);

    // jacobian cell 01
    J[0][1] =
        (leftInnerLength *
        leftBaseAngleCos) -
        (leftInnerLength *
        rightElbowInsideAngleMinusLeftBaseAngleSin *
        leftElbowInsideAngleCos /
        leftElbowInsideAngleMinusRightElbowInsideAngleSin);

    // jacobian cell 10
    J[1][0] =
        lowerRowSharedFactor *
        leftElbowInsideAngleSin /
        leftElbowInsideAngleMinusRightElbowInsideAngleSin;

    // jacobian cell 11
    J[1][1] =
        -lowerRowSharedFactor *
        leftElbowInsideAngleCos /
        leftElbowInsideAngleMinusRightElbowInsideAngleSin;
}

void Panto::inverseKinematics()
{
    if (isnan(target.x) || isnan(target.y))
    {
        targetAngle[0] = NAN;
        targetAngle[1] = NAN;
        return;
    }
    if (isforceRendering)
    {
        targetAngle[0] = J[0][0] * target.x + J[0][1] * target.y;
        targetAngle[1] = J[1][0] * target.x + J[1][1] * target.y;
    }
    else
    {
        // const for panto
        const auto leftIndex = dofIndex;
        const auto rightIndex = dofIndex + 1;
        const auto leftInnerLength = linkageInnerLength[leftIndex];
        const auto rightInnerLength = linkageInnerLength[rightIndex];
        const auto leftInnerLengthDoubled = 2 * linkageInnerLength[leftIndex];
        const auto rightInnerLengthDoubled = 2 * linkageInnerLength[rightIndex];
        const auto leftOuterLength = linkageOuterLength[leftIndex];
        const auto rightOuterLength = linkageOuterLength[rightIndex];
        const auto leftInnerLengthSquared = leftInnerLength * leftInnerLength;
        const auto rightInnerLengthSquared = rightInnerLength * rightInnerLength;
        const auto leftOuterLengthSquared = leftOuterLength * leftOuterLength;
        const auto rightOuterLengthSquared = rightOuterLength * rightOuterLength;
        const auto leftInnerLengthSquaredMinusLeftOuterLengthSquared = leftInnerLengthSquared - leftOuterLengthSquared;
        const auto rightInnerLengthSquaredMinusRightOuterLengthSquared = rightInnerLengthSquared - rightOuterLengthSquared;
        const auto leftBase = base[leftIndex];
        const auto rightBase = base[rightIndex];
        const auto leftBaseX = leftBase.x;
        const auto leftBaseY = leftBase.y;
        const auto rightBaseX = rightBase.x;
        const auto rightBaseY = rightBase.y;

        const auto targetX = target.x;
        const auto targetY = target.y;
        // DPSerial::sendInstantDebugLog("lbx %+08.3f lby %+08.3f rbx %+08.3f rby %+08.3f tgx %+08.3f tgy %+08.3f", leftBaseX, leftBaseY, rightBaseX, rightBaseY, targetX, targetY);
        const auto leftBaseToTargetX = targetX - leftBaseX;
        const auto leftBaseToTargetY = targetY - leftBaseY;
        const auto rightBaseToTargetX = targetX - rightBaseX;
        const auto rightBaseToTargetY = targetY - rightBaseY;
        const auto leftBaseToTargetSquared = leftBaseToTargetX * leftBaseToTargetX + leftBaseToTargetY * leftBaseToTargetY;
        const auto rightBaseToTargetSquared = rightBaseToTargetX * rightBaseToTargetX + rightBaseToTargetY * rightBaseToTargetY;
        const auto leftBaseToTargetLength =
            std::sqrt(leftBaseToTargetSquared);
        const auto rightBaseToTargetLength =
            std::sqrt(rightBaseToTargetSquared);

        const auto leftInnerAngleCos =
            (leftBaseToTargetSquared +
            leftInnerLengthSquaredMinusLeftOuterLengthSquared) /
            (leftInnerLengthDoubled * leftBaseToTargetLength);
        const auto rightInnerAngleCos =
            (rightBaseToTargetSquared +
            rightInnerLengthSquaredMinusRightOuterLengthSquared) /
            (rightInnerLengthDoubled * rightBaseToTargetLength);
        const auto leftInnerAngle = std::acos(leftInnerAngleCos);
        const auto rightInnerAngle = std::acos(rightInnerAngleCos);
        const auto leftOffsetAngle =
            std::atan2(leftBaseToTargetY, leftBaseToTargetX);
        const auto rightOffsetAngle =
            std::atan2(rightBaseToTargetY, rightBaseToTargetX);
        // DPSerial::sendInstantDebugLog("lbttx %+08.3f lbtty %+08.3f rbttx %+08.3f rbtty %+08.3f", leftBaseToTargetY, leftBaseToTargetX, rightBaseToTargetY, rightBaseToTargetX);
        
        const auto leftAngle = leftOffsetAngle - leftInnerAngle;
        const auto rightAngle = rightOffsetAngle + rightInnerAngle;

        // DPSerial::sendInstantDebugLog("li %+08.3f lo %+08.3f la %+08.3f ri %+08.3f ro %+08.3f ra %+08.3f", degrees(leftInnerAngle), degrees(leftOffsetAngle), degrees(leftAngle), degrees(rightInnerAngle), degrees(rightOffsetAngle), degrees(rightAngle));
        // DPSerial::sendInstantDebugLog("target (%+08.3f, %+08.3f) la %+08.3f ra %+08.3f", targetX, targetY, degrees(leftAngle), degrees(rightAngle));

        targetAngle[0] = leftAngle;
        targetAngle[1] = rightAngle;
    }
};

void Panto::setMotor(unsigned char i, bool dir, float power)
{
    if (motorFlipped[dofIndex + i])
        dir = !dir;

    digitalWrite(motorDirAPin[dofIndex + i], dir);
    digitalWrite(motorDirBPin[dofIndex + i], !dir);
    if (motorPwmPin[dofIndex + i] != dummyPin)
    {
        power = min(power, motorPowerLimit[dofIndex + i]);
        if (power < motorPowerLimit[dofIndex + i])
            engagedTime[i] = 0;
        else if (++engagedTime[i] >= 36000)
        {
            disengageMotors();
            while (1)
                ;
        }
        ledcWrite(dofIndex + i, power * PWM_MAX);
    }
};

void Panto::setup(unsigned char _dofIndex)
{
    dofIndex = _dofIndex * 3;
    base[0] = Vector2D(linkageBaseX[dofIndex + 0], linkageBaseY[dofIndex + 0]);
    base[1] = Vector2D(linkageBaseX[dofIndex + 1], linkageBaseY[dofIndex + 1]);
    target = Vector2D(NAN, NAN);
    for (unsigned char i = 0; i < 3; ++i)
    {
        actuationAngle[i] = setupAngle[dofIndex + i] * 2.0 * PI;
        targetAngle[i] = NAN;
        previousDiff[i] = 0.0;
        integral[i] = 0.0;
        if (encoderAPin[dofIndex + i] != dummyPin && encoderBPin[dofIndex + i] != dummyPin)
            encoder[i] = new Encoder(encoderAPin[dofIndex + i], encoderBPin[dofIndex + i]);
        else
            encoder[i] = NULL;

        // we don't need additional checks aroud these - if the dummyPin is set properly, the ESP lib will check this anyway
        pinMode(encoderIndexPin[dofIndex + i], INPUT);
        pinMode(motorDirAPin[dofIndex + i], OUTPUT);
        pinMode(motorDirBPin[dofIndex + i], OUTPUT);
        pinMode(motorPwmPin[dofIndex + i], OUTPUT);

        ledcSetup(dofIndex + i, ledcFrequency, ledcResolution);
        ledcAttachPin(motorPwmPin[dofIndex + i], dofIndex + i);

        // TODO: Calibration
        // Use encoder index pin and actuate the motors to reach it
        setMotor(i, false, 0);
    }
};

void Panto::calibrationEnd()
{
    for (unsigned char i = 0; i < 3; ++i)
    {
        // setMotor(i, false, 0);
        if (encoder[i])
            encoder[i]->write(actuationAngle[i] / (2.0 * PI) * encoderSteps[dofIndex + i]);
    }
};

void Panto::readEncoders()
{
    #ifdef LINKAGE_ENCODER_USE_SPI
    for (unsigned char i = 0; i < 2; ++i)
    {
        actuationAngle[i] =
            encoderFlipped[dofIndex + i] * 2 * PI * angleAccessors[i]() / encoderSteps[dofIndex + i];
    }
    actuationAngle[2] = (encoder[2]) ? 
        (encoderFlipped[dofIndex + 2] * 2 * PI * encoder[2]->read() / encoderSteps[dofIndex + 2]) : NAN;
    #else
    for (unsigned char i = 0; i < 3; ++i)
    actuationAngle[i] = 
        (encoder[i]) ? 
        (encoderFlipped[dofIndex + i] * 2 * PI * encoder[i]->read() / encoderSteps[dofIndex + i]) :
        NAN;
    #endif
    
    actuationAngle[2] = fmod(actuationAngle[2], 2 * PI);
};

void Panto::actuateMotors()
{
    for (unsigned char i = 0; i < 3; ++i)
    {
        if (isnan(targetAngle[i]))
        {
            setMotor(i, false, 0);
            continue;
        }
        if (isforceRendering)
        {
            setMotor(i, targetAngle[i] < 0, fabs(targetAngle[i]) * forceFactor);
        }
        else
        {
            float border = PI / 2;
            if (actuationAngle[i] < border && border < targetAngle[i])
            {
                actuationAngle[i] += 2 * PI;
            }
            else if (actuationAngle[i] > border && border > targetAngle[i])
            {
                targetAngle[i] += 2 * PI;
            }
            float error = targetAngle[i] - actuationAngle[i];
            if (i == 2)
            { // Linkage offsets handle
                error -= innerAngle[linkageHandleMount[dofIndex + 2]];
                if (error > PI)
                    error -= 2 * PI;
                else if (error < -PI)
                    error += 2 * PI;
            }
            unsigned char dir = error < 0;
            error = fabs(error);
            // Power: PID
            integral[i] += error * dt;
            float derivative = (error - previousDiff[i]) / dt;
            previousDiff[i] = error;
            setMotor(i, dir, pidFactor[dofIndex + i][0] * error + pidFactor[dofIndex + i][1] * integral[i] + pidFactor[dofIndex + i][2] * derivative);
        }
    }
};

void Panto::disengageMotors()
{
    for (unsigned char i = 0; i < dofCount; ++i)
    {
        targetAngle[i] = NAN;
        setMotor(i, false, 0);
    }
    target = Vector2D(NAN, NAN);
};
