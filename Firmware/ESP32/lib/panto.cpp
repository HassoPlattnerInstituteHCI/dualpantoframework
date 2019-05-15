#include "panto.hpp"
#include <vector>

float Panto::dt = 0;
Panto pantos[pantoCount];

void Panto::forwardKinematics()
{
    std::vector<Vector2D> innerPoints = getInnerPositions(actuationAngle);
    handle = getHandlePosition(innerPoints);
    std::vector<float> angles = getAngles(handle, innerPoints, actuationAngle);
    innerAngle[0] = angles[0];
    innerAngle[1] = angles[1];
    pointingAngle = angles[2];
    std::vector<std::vector<float>> jacobianMatrix = getJacobianMatrix(actuationAngle, angles);
    J[0][0] = jacobianMatrix[0][0];
    J[0][1] = jacobianMatrix[0][1];
    J[1][0] = jacobianMatrix[1][0];
    J[1][1] = jacobianMatrix[1][1];
};

std::vector<Vector2D> Panto::getInnerPositions(float actuAngles[]){
    return std::vector<Vector2D>{base[0] + Vector2D::fromPolar(actuAngles[0], linkageInnerLength[dofIndex + 0]), base[1] + Vector2D::fromPolar(actuAngles[1], linkageInnerLength[dofIndex + 1])};
}

Vector2D Panto::getHandlePosition(std::vector<Vector2D> innerPoints)
{
    Vector2D diagonal = innerPoints[1] - innerPoints[0];

    float inAngles[2];
    inAngles[0] = diagonal.angle() - acos((diagonal.length() * diagonal.length() + linkageOuterLength[dofIndex + 0] * linkageOuterLength[dofIndex + 0] - linkageOuterLength[dofIndex + 1] * linkageOuterLength[dofIndex + 1]) / (2 * diagonal.length() * linkageOuterLength[dofIndex + 0]));
    Vector2D returnHandle = Vector2D::fromPolar(inAngles[0], linkageOuterLength[dofIndex + 0]) + innerPoints[0];

    return returnHandle;
}

std::vector<float> Panto::getAngles(Vector2D handle, std::vector<Vector2D> innerPoints, float actuationAngles[])
{
    std::vector<float> angles = std::vector<float>{(handle - innerPoints[0]).angle(), (handle - innerPoints[1]).angle()};
    angles.push_back(actuationAngles[2] + angles[linkageHandleMount[dofIndex + 2]]);
    return angles;
}

std::vector<std::vector<float>> Panto::getJacobianMatrix(float actuationAngles[], std::vector<float> angles)
{  
    std::vector<float> firstRow = std::vector<float>{-linkageInnerLength[dofIndex + 0] * sin(actuationAngle[0]) -
              (linkageInnerLength[dofIndex + 0] * sin(angles[0]) * sin(angles[1] - actuationAngle[0])) / (sin(angles[0] - angles[1])),
              linkageInnerLength[dofIndex + 0] * cos(actuationAngle[0]) +
              (linkageInnerLength[dofIndex + 0] * cos(angles[0]) * sin(angles[1] - actuationAngle[0])) / (sin(angles[0] - angles[1]))};
    std::vector<float> secondRow = std::vector<float>{(linkageInnerLength[dofIndex + 1] * sin(angles[0]) * sin(angles[1] - actuationAngle[1])) / (sin(angles[0] - angles[1])), 
                -(linkageInnerLength[dofIndex + 1] * cos(angles[0]) * sin(angles[1] - actuationAngle[1])) / (sin(angles[0] - angles[1]))};

    return std::vector<std::vector<float>>{firstRow, secondRow};
}

void Panto::inverseKinematicsHelper(float actuAngles[], float inverted, float diff, float factor, float threshold)
{
    diff *= factor;
    if (fabs(diff) < threshold)
    {
        return;
    }
    actuAngles[0] += diff;
    actuAngles[1] += diff * inverted;
};

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
        const unsigned int iterations = 20;
        float nextAngle = constrain(target.angle(), (-PI - opAngle) * 0.5, (-PI + opAngle) * 0.5);
        float nextRadius = constrain(target.length(), opMinDist, opMaxDist);

        float actuAngles[] = {actuationAngle[0], actuationAngle[1]};
        for (unsigned int i = 0; i < iterations; ++i)
        {
            std::vector<Vector2D> inversePoints = getInnerPositions(actuAngles);
            Vector2D inverseHandle = getHandlePosition(inversePoints);
            inverseKinematicsHelper(actuAngles, +1, nextAngle - inverseHandle.angle(), 0.5);
            inverseKinematicsHelper(actuAngles, -1, nextRadius - inverseHandle.length(), 0.002);
        }
        targetAngle[0] = actuAngles[0];
        targetAngle[1] = actuAngles[1];
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
