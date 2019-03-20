#include "panto.hpp"

float Panto::dt = 0;
Panto pantos[pantoCount];

void Panto::forwardKinematics()
{
    inner[0] = base[0] + Vector2D::fromPolar(actuationAngle[0], linkageInnerLength[dofIndex + 0]);
    inner[1] = base[1] + Vector2D::fromPolar(actuationAngle[1], linkageInnerLength[dofIndex + 1]);
    Vector2D diagonal = inner[1] - inner[0];
    innerAngle[0] = diagonal.angle() - acos((diagonal * diagonal + linkageOuterLength[dofIndex + 0] * linkageOuterLength[dofIndex + 0] - linkageOuterLength[dofIndex + 1] * linkageOuterLength[dofIndex + 1]) / (2 * diagonal.length() * linkageOuterLength[dofIndex + 0]));
    handle = Vector2D::fromPolar(innerAngle[0], linkageOuterLength[dofIndex + 0]) + inner[0];
    innerAngle[1] = (handle - inner[1]).angle();
    pointingAngle = actuationAngle[2] + innerAngle[linkageHandleMount[dofIndex + 2]];

    J[0][0] = -linkageInnerLength[dofIndex + 0] * sin(actuationAngle[0]) -
              (linkageInnerLength[dofIndex + 0] * sin(innerAngle[0]) * sin(innerAngle[1] - actuationAngle[0])) / (sin(innerAngle[0] - innerAngle[1]));
    J[0][1] = linkageInnerLength[dofIndex + 0] * cos(actuationAngle[0]) +
              (linkageInnerLength[dofIndex + 0] * cos(innerAngle[0]) * sin(innerAngle[1] - actuationAngle[0])) / (sin(innerAngle[0] - innerAngle[1]));
    J[1][0] = (linkageInnerLength[dofIndex + 1] * sin(innerAngle[0]) * sin(innerAngle[1] - actuationAngle[1])) / (sin(innerAngle[0] - innerAngle[1]));
    J[1][1] = -(linkageInnerLength[dofIndex + 1] * cos(innerAngle[0]) * sin(innerAngle[1] - actuationAngle[1])) / (sin(innerAngle[0] - innerAngle[1]));
};

void Panto::inverseKinematicsHelper(float inverted, float diff, float factor, float threshold)
{
    diff *= factor;
    if (fabs(diff) < threshold)
        return;
    actuationAngle[0] += diff;
    actuationAngle[1] += diff * inverted;
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
        const unsigned int iterations = 10;
        float nextAngle = constrain(target.angle(), (-PI - opAngle) * 0.5, (-PI + opAngle) * 0.5),
              nextRadius = constrain(target.length(), opMinDist, opMaxDist),
              savedActuationAngle[] = {actuationAngle[0], actuationAngle[1]};
        for (unsigned int i = 0; i < iterations; ++i)
        {
            forwardKinematics();
            inverseKinematicsHelper(+1, nextAngle - handle.angle(), 0.5);
            inverseKinematicsHelper(-1, nextRadius - handle.length(), 0.002);
        }
        targetAngle[0] = actuationAngle[0];
        targetAngle[1] = actuationAngle[1];
        actuationAngle[0] = savedActuationAngle[0];
        actuationAngle[1] = savedActuationAngle[1];
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
