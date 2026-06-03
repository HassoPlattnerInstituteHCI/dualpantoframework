#include "hardware/panto.hpp"

#include <vector>

#include "utils/performanceMonitor.hpp"
#include "utils/serial.hpp"



std::vector<Panto> pantos;

void Panto::forwardKinematics()
{
    // base angles
    // PERFMON_START("[abba] base angles");
    // https://cim.mcgill.ca/~haptic/pub/GC-QW-VH-IROS-05.pdf
    const auto leftBaseAngle = m_actuationAngle[c_localLeftIndex]; // -pi at rest position
    const auto rightBaseAngle = m_actuationAngle[c_localRightIndex]; // 0 at rest 
    const auto handleAngle = m_actuationAngle[c_localHandleIndex];

    const auto theta_1 = leftBaseAngle + M_PI; // 0 at rest position 
    const auto theta_5 = rightBaseAngle + M_PI; // pi at rest position

    const auto a_1 = c_leftInnerLength;
    const auto a_2 = c_leftOuterLength;
    const auto a_3 = c_rightOuterLength;
    const auto a_4 = c_rightInnerLength;
    const auto a_5 = c_rightBaseX - c_leftBaseX;

    // P2
    const auto x_2 = a_1 * cos(theta_1);
    const auto y_2 = a_1 * sin(theta_1);

    // P4
    const auto x_4 = a_4 * cos(theta_5) - a_5;
    const auto y_4 = a_4  * sin(theta_5);

    // ||P4 - P2||
    const auto dist_p_4_minus_p_2 = sqrt(pow((x_4 - x_2), 2) + pow((y_4 - y_2), 2));
    // ||P2 - P4||
    const auto dist_p_2_minus_p_4 = sqrt(pow((x_2 - x_4), 2) + pow((y_2 - y_4), 2));
    // ||P2 - Ph||
    const auto dist_p_2_minus_p_h = (a_2 * a_2 - a_3 * a_3 + dist_p_4_minus_p_2 * dist_p_4_minus_p_2)/(2*dist_p_4_minus_p_2); 
    
    // Ph
    const auto x_h = x_2 + dist_p_2_minus_p_h/dist_p_2_minus_p_4*(x_4-x_2);
    const auto y_h = y_2 + dist_p_2_minus_p_h/dist_p_2_minus_p_4*(y_4-y_2);
    
    // ||P3 - Ph||
    const auto dist_p_3_minus_p_h = sqrt(a_2 * a_2 - dist_p_2_minus_p_h * dist_p_2_minus_p_h);

    // P3
    const auto x_3 = x_h + dist_p_3_minus_p_h/dist_p_2_minus_p_4 * (y_4 - y_2);
    const auto y_3 = y_h - dist_p_3_minus_p_h/dist_p_2_minus_p_4 * (x_4 - x_2);


    const auto h = sqrt(pow(x_3 - x_h, 2) + pow(y_3 - y_h, 2));
    const auto d = sqrt(pow(x_2 - x_4, 2) + pow(y_2 - y_4, 2));
    const auto b = dist_p_2_minus_p_h;

    // the derivatives delta_1_x_2 and delta_5_x_4 given in the paper are wrong (missing a minus)
    const auto delta_1_x_2 = -a_1 * sin(theta_1);
    const auto delta_1_y_2 = a_1 * cos(theta_1);

    const auto delta_5_x_4 = -a_4 * sin(theta_5);
    const auto delta_5_y_4 = a_4 * cos(theta_5);

    // yes, this needs to be 0
    const auto delta_1_y_4 = 0;
    const auto delta_1_x_4 = 0;
    const auto delta_5_y_2 = 0;
    const auto delta_5_x_2 = 0;

    const auto delta_1_d = ((x_4 - x_2) * (delta_1_x_4 - delta_1_x_2) + (y_4 - y_2) * (delta_1_y_4 - delta_1_y_2)) / d;
    const auto delta_5_d = ((x_4 - x_2) * (delta_5_x_4 - delta_5_x_2) + (y_4 - y_2) * (delta_5_y_4 - delta_5_y_2)) / d;
    
    const auto delta_1_b = delta_1_d - (delta_1_d * (a_2 * a_2 - a_3 * a_3 + d * d)) / (2 * d * d);
    const auto delta_5_b = delta_5_d - (delta_5_d * (a_2 * a_2 - a_3 * a_3 + d * d)) / (2 * d * d);

    const auto delta_1_h = -b * delta_1_b / h;
    const auto delta_5_h = -b * delta_5_b / h;

    const auto delta_1_x_h = delta_1_x_2 + (delta_1_b * d - delta_1_d * b) / (d * d) * (x_4 - x_2) + b/d * (delta_1_x_4 - delta_1_x_2);
    const auto delta_5_x_h = delta_5_x_2 + (delta_5_b * d - delta_5_d * b) / (d * d) * (x_4 - x_2) + b/d * (delta_5_x_4 - delta_5_x_2);

    const auto delta_1_y_h = delta_1_y_2 + (delta_1_b * d - delta_1_d * b) / (d * d) * (y_4 - y_2) + b/d * (delta_1_y_4 - delta_1_y_2);
    const auto delta_5_y_h = delta_5_y_2 + (delta_5_b * d - delta_5_d * b) / (d * d) * (y_4 - y_2) + b/d * (delta_5_y_4 - delta_5_y_2);

    const auto delta_1_x_3 = delta_1_x_h + h /d * (delta_1_y_4 - delta_1_y_2) + (delta_1_h * d - delta_1_d * h) / (d * d) * (y_4 - y_2);
    const auto delta_5_x_3 = delta_5_x_h + h /d * (delta_5_y_4 - delta_5_y_2) + (delta_5_h * d - delta_5_d * h) / (d * d) * (y_4 - y_2);
    
    const auto delta_1_y_3 = delta_1_y_h - h /d * (delta_1_x_4 - delta_1_x_2) - (delta_1_h * d - delta_1_d * h) / (d * d) * (x_4 - x_2);
    const auto delta_5_y_3 = delta_5_y_h - h /d * (delta_5_x_4 - delta_5_x_2) - (delta_5_h * d - delta_5_d * h) / (d * d) * (x_4 - x_2);

    // offset by left base and mirror coordinate system across x and y
    m_handleX = -(x_3 - c_leftBaseX);
    m_handleY = -y_3;

    // const auto rightElbowTotalAngle = atan((m_handleY - y_4) / (x_4 - m_handleX));
    // const auto leftElbowTotalAngle = atan((m_handleY - y_2) / (m_handleX - x_2));
    const auto rightElbowTotalAngle = -atan((y_3 - y_4) / (x_4 - x_3));
    const auto leftElbowTotalAngle = atan((y_3 - y_2) / (x_3 - x_2));

    m_pointingAngle =
        handleAngle +
        (encoderFlipped[c_globalHandleIndex]==1? -1 : 1)* //sign changes when encoder is flipped
        (c_handleMountedOnRightArm==1 ?
        (-rightElbowTotalAngle) :
        (leftElbowTotalAngle));

    // set jacobian matrix
    // PERFMON_START("[abbl] set jacobian matrix");
    m_jacobian[0][0] = delta_1_x_3;
    m_jacobian[0][1] = delta_5_x_3;
    m_jacobian[1][0] = delta_1_y_3;
    m_jacobian[1][1] = delta_5_y_3;
    // PERFMON_STOP("[abbl] set jacobian matrix");
    inverseKinematics();
}

void Panto::inverseKinematics()
{

    //update tweening delta micro here
    unsigned long now = micros();
    float tweening_dt = now - m_tweeningPrevtime;
    m_tweeningPrevtime = now;

    if (isnan(m_targetX) || isnan(m_targetY))
    {
        m_targetAngle[c_localLeftIndex] = NAN;
        m_targetAngle[c_localRightIndex] = NAN;
    }
    else if (m_isforceRendering)
    {
        // apply transformation J^T(-w), so that w is mirrored across x and y
        // forces in CCW direction
        auto forceL =
            m_jacobian[0][0] * -m_targetX +
            m_jacobian[1][0] * -m_targetY;

        auto forceR =
            m_jacobian[0][1] * -m_targetX +
            m_jacobian[1][1] * -m_targetY;

        // normalize to prevent clamping
        // max target force
        float m = max(abs(forceL), abs(forceR)) * forceFactor;
        // min allowed force
        float M = min(motor_powerLimitForce[c_globalIndexOffset + c_localLeftIndex], 
                     motor_powerLimitForce[c_globalIndexOffset + c_localRightIndex]);
        
        // Caution: m_targetAngle is a polar force vector, not actual angles
        if (m > M) {
            float s = M / m;
            m_targetAngle[c_localLeftIndex] = s * forceL;
            m_targetAngle[c_localRightIndex] = s * forceR;
        } else {
            m_targetAngle[c_localLeftIndex] = forceL;
            m_targetAngle[c_localRightIndex] = forceR;
        }
    }
    else
    {
        // tweening
        const auto leftBaseToTargetX = m_filteredX - c_leftBaseX;
        const auto leftBaseToTargetY = m_filteredY - c_leftBaseY;
        const auto rightBaseToTargetX = m_filteredX - c_rightBaseX;
        const auto rightBaseToTargetY = m_filteredY - c_rightBaseY;
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

        m_targetAngle[c_localLeftIndex] = ensureAngleRange(leftAngle);
        m_targetAngle[c_localRightIndex] = ensureAngleRange(rightAngle);

        if(abs(m_filteredX - m_targetX) + abs(m_filteredY - m_targetY) < 0.01f && m_inTransition){
            m_inTransition = false;
        }

        m_filteredX = (m_targetX-m_startX)*m_tweeningValue+m_startX;
        m_filteredY = (m_targetY-m_startY)*m_tweeningValue+m_startY;
        float stepValue = 0.000001 * tweening_dt * m_tweeningSpeed;
        m_tweeningValue=min(m_tweeningValue+stepValue, 1.0f);

    }
};

void Panto::setMotor(
    const uint8_t& localIndex, const bool& dir, const float& power)
{
    const auto globalIndex = c_globalIndexOffset + localIndex;

    if(motorPwmPin[globalIndex] == dummyPin && motorPwmPinForwards[globalIndex] == dummyPin)
    {
        return;
    }

    const auto flippedDir = dir ^ motorFlipped[globalIndex];

    if(motorPwmPinForwards[globalIndex] != dummyPin)
    {
        if(!flippedDir) {
            ledcWrite(globalIndex+6, 0);//min(power, motorPowerLimit[globalIndex]) * PWM_MAX);
            ledcWrite(globalIndex, min(power,
            (m_isforceRendering) ? motor_powerLimitForce[globalIndex] : motorPowerLimit[globalIndex]) * PWM_MAX);
        }
        else {
            ledcWrite(globalIndex, 0);//min(power, motorPowerLimit[globalIndex]) * PWM_MAX);
            ledcWrite(globalIndex+6, min(power,
            (m_isforceRendering) ? motor_powerLimitForce[globalIndex] : motorPowerLimit[globalIndex]) * PWM_MAX);
        }
        return;
    }


    digitalWrite(motorDirAPin[globalIndex], flippedDir);
    digitalWrite(motorDirBPin[globalIndex], !flippedDir);
    ledcWrite(globalIndex, min(power, motorPowerLimit[globalIndex]) * PWM_MAX);
};

void Panto::readEncoders()
{
    #ifdef LINKAGE_ENCODER_USE_SPI
    for (auto localIndex = 0; localIndex < c_dofCount - 1; ++localIndex)
    {
        const auto globalIndex = c_globalIndexOffset + localIndex;
        //TODO filter out zero value of raw encoder value

        if (m_angleAccessors[localIndex]() == 0)
        {
            m_actualAngleAccessors[localIndex] = m_prevAngleAccessors[localIndex];
        }else{
            m_actualAngleAccessors[localIndex] = m_angleAccessors[localIndex]();
        }

        m_prevAngleAccessors[localIndex] = m_angleAccessors[localIndex]();

        m_previousAngle[localIndex] =
            ensureAngleRange(
                encoderFlipped[globalIndex] *
                TWO_PI * m_actualAngleAccessors[localIndex] /
                encoderSteps[globalIndex]);
        m_encoderRequestCount++;
        m_encoderRequestCounts[localIndex]++;

    }
    m_actuationAngle[c_localHandleIndex] =
        (m_encoder[c_localHandleIndex]) ?
        (encoderFlipped[c_globalHandleIndex] *
        (c_pantoIndex == 0 ? (handleEncodersInvertedUpper? -1 : 1) : (handleEncodersInvertedLower? -1 : 1))*
        TWO_PI * m_encoder[c_localHandleIndex]->read() /
        encoderSteps[c_globalHandleIndex]) :
        NAN;

    #else
    for (auto localIndex = 0; localIndex < c_dofCount; ++localIndex)
    {
        const auto globalIndex = c_globalIndexOffset + localIndex;
        m_actuationAngle[localIndex] =
            ensureAngleRange(
                (m_encoder[localIndex]) ?
                (encoderFlipped[globalIndex] *
                TWO_PI * m_encoder[localIndex]->read() /
                encoderSteps[globalIndex]) :
                NAN);
    }
    #endif



    m_previousAngle[c_localHandleIndex] = m_actuationAngle[c_localHandleIndex];
    m_actuationAngle[c_localHandleIndex] = fmod(m_actuationAngle[c_localHandleIndex], TWO_PI);
    for (auto localIndex = 0; localIndex < c_dofCount - 1; ++localIndex)
    {
        if(m_previousAngle[localIndex]==0)return;
    }
    if(m_previousAnglesCount>4){
        m_previousAnglesCount=0;
        for (auto localIndex = 0; localIndex < c_dofCount - 1; ++localIndex)
        {
            std::sort(m_previousAngles[localIndex],m_previousAngles[localIndex] + sizeof(m_previousAngles[localIndex])/sizeof(m_previousAngles[localIndex][0]));
            m_actuationAngle[localIndex] = m_previousAngles[localIndex][2];
        }
    }
    else{
        for (auto localIndex = 0; localIndex < c_dofCount - 1; ++localIndex)
        {
            m_previousAngles[localIndex][m_previousAnglesCount] = m_previousAngle[localIndex];
        }
    }
    m_previousAnglesCount++;
};

void Panto::actuateMotors()
{
    for (auto localIndex = 0; localIndex < c_dofCount; ++localIndex)
    {
        if (isnan(m_targetAngle[localIndex]))
        {
            // free motor
            setMotor(localIndex, false, 0);
        } else if (m_isforceRendering)
        {
            setMotor(
                localIndex,
                m_targetAngle[localIndex] < 0,
                fabs(m_targetAngle[localIndex]) * forceFactor);
        } else
        {
            auto error =
                m_targetAngle[localIndex] - m_actuationAngle[localIndex];
            if (localIndex == c_localHandleIndex)
            {
                // Linkage offsets handle
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
                if(encoderFlipped[c_globalHandleIndex]==1) error*=-1;
            }
            unsigned char dir = error < 0;
            unsigned long now = micros();
            float dt = now - m_prevTime;
            m_prevTime = now;
            error = fabs(error);
            // Power: PID
            m_integral[localIndex] = min(0.5f, m_integral[localIndex] + error * dt);
            float derivative = (error - m_previousDiff[localIndex]) / dt;
            m_previousDiff[localIndex] = error;
            const auto globalIndex = c_globalIndexOffset + localIndex;
            const auto& pid = pidFactor[globalIndex];
            float pVal = pid[0] * error;
            float dVal = pid[2] * derivative;
            dVal = pVal + dVal > 0 ? dVal : 0;
            setMotor(
                localIndex,
                dir,
                pVal +
                pid[1] * m_integral[localIndex] +
                dVal);
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
, c_globalRightIndex(c_globalIndexOffset + c_localRightIndex)
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
, c_leftBaseY(linkageBaseY[c_globalLeftIndex])
, c_rightBaseX(linkageBaseX[c_globalRightIndex])
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

        if(motorPwmPinForwards[globalIndex] == dummyPin) {
            pinMode(motorPwmPin[globalIndex], OUTPUT);

            ledcSetup(globalIndex, c_ledcFrequency, c_ledcResolution);
            ledcAttachPin(motorPwmPin[globalIndex], globalIndex);
        }

        if(motorPwmPin[globalIndex] == dummyPin && motorPwmPinForwards[globalIndex] != dummyPin) {
            pinMode(motorPwmPinForwards[globalIndex], OUTPUT);
            pinMode(motorPwmPinBackwards[globalIndex], OUTPUT);

            // TODO: initiate the PWM channels independent from globalIndex
            ledcSetup(globalIndex, c_ledcFrequency, c_ledcResolution);
            ledcSetup(globalIndex+6, c_ledcFrequency, c_ledcResolution);

            //DPSerial::sendInstantDebugLog("attaching gi %i to pwm %i and pwm %i\n", globalIndex, motorPwmPinForwards[globalIndex], motorPwmPinBackwards[globalIndex]);

            ledcAttachPin(motorPwmPinForwards[globalIndex], globalIndex);
            ledcAttachPin(motorPwmPinBackwards[globalIndex], globalIndex+6);

            ledcWrite(globalIndex, 0.1*PWM_MAX);
            delay(10);
            ledcWrite(globalIndex, 0);
            delay(10);
            ledcWrite(globalIndex+6, 0.1*PWM_MAX);
            delay(10);
            ledcWrite(globalIndex+6, 0);
            /*
            ledcWrite(globalIndex, 0.2*PWM_MAX);
            delay(2000);
            ledcWrite(globalIndex, 0);
            */

        }
        // TODO: Calibration
        // Use encoder index pin and actuate the motors to reach it
        setMotor(localIndex, false, 0);
    }
    //Kalman
    setKalman();
};

void Panto::setKalman() {
    // time evolution matrix (whatever... it will be updated inloop)
    K.F = {1.0, 0.0, 0.0,0.0,
           0.0, 1.0, 0.0, 0.0,
           0.0, 0.0, 1.0, 0.0,
           0.0, 0.0, 0.0, 1.0};

    // measurement matrix n the position (e.g. GPS) and acceleration (e.g. accelerometer)
    K.H = {1.0, 0.0, 0.0, 0.0,
           0.0, 1.0, 0.0, 0.0};
    // measurement covariance matrix
    K.R = {n_p*n_p,   0.0,
           0.0, n_a*n_a};
    // model covariance matrix
    K.Q = {1.0, 0.0, 0.0,0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0};
    state.Fill(0.0);
    obs.Fill(0.0);

}

// void Panto::calibrateEncoders(){
//     #ifdef LINKAGE_ENCODER_USE_SPI
//     for (auto localIndex = 0; localIndex < c_dofCount - 1; ++localIndex)
//     {
//         //Write encoder values to EEPROM
//         EEPROM.writeInt((3*c_pantoIndex*sizeof(uint32_t)+localIndex*sizeof(uint32_t)),m_angleAccessors[localIndex]());
//     }
//     #endif
// }

void Panto::resetActuationAngle(){
   m_actuationAngle[c_localHandleIndex] = setupAngle[c_globalHandleIndex] * TWO_PI;
}

bool Panto::getCalibrationState(){
    return m_isCalibrating;
}

void Panto::calibratePanto(){
    m_isCalibrating = true;
}

void Panto::calibrationEnd()
{
    for (auto localIndex = 0; localIndex < 3; ++localIndex)
    {
        if (m_encoder[localIndex]) // only for handle encoders
        {
            const auto globalIndex = c_globalIndexOffset + localIndex;
            m_encoder[localIndex]->write(
                m_actuationAngle[localIndex] /
                (TWO_PI) *
                encoderSteps[globalIndex]);
        }
    }
    resetActuationAngle();
    m_isCalibrating = false;
};

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
    const AngleAccessor accessor)
{
    m_angleAccessors[localIndex] = accessor;
};

void Panto::setHandleEncoderParameters(
    const uint32_t handleEncoderStepsUpper,
    const uint32_t handleEncoderStepsLower,
    const bool isInvertedUpper,
    const bool isInvertedLower
)
{
    encoderSteps[2] = handleEncoderStepsUpper;
    encoderSteps[5] = handleEncoderStepsLower;
    handleEncodersInvertedUpper = isInvertedUpper;
    handleEncodersInvertedLower = isInvertedLower;
};

void Panto::setTarget(const Vector2D target, const bool isForceRendering)
{
    m_isforceRendering = isForceRendering;
    m_targetX = target.x;
    m_targetY = target.y;
    m_startX = m_handleX;
    m_startY = m_handleY;
    m_filteredX = m_startX;
    m_filteredY = m_startY;
    m_tweeningValue = 0.0f;

    float dx = (m_targetX - m_startX);
    float dy = (m_targetY - m_startY);
    float d  = max((float)sqrt(dx*dx + dy*dy), 1.0f); //distance to target: avoiding 0 division

    const float velocity = 0.001 * m_tweeningSpeed; //[mm / s] maybe?

    m_tweeningStep = velocity / d;
    inverseKinematics();
};

void Panto::setSpeed(const float _speed){
    m_tweeningSpeed = _speed;
}

void Panto::setRotation(const float rotation)
{
    m_targetAngle[c_localHandleIndex] = rotation;
};

int Panto::getEncoderErrorCount(){
    int res= m_encoderErrorCount;
    m_encoderErrorCount =0;
    return res;
}

int Panto::getEncoderErrorCounts(int i){
    int res= m_encoderErrorCounts[i];
    m_encoderErrorCounts[i] =0;
    return res;
}
int Panto::getEncoderRequests(){
    int res= m_encoderRequestCount;
    m_encoderRequestCount =0;
    return res;
}

int Panto::getEncoderRequestsCounts(int i){
    int res= m_encoderRequestCounts[i];
    m_encoderRequestCounts[i] =0;
    return res;
}

uint8_t Panto::getPantoIndex(){
    return c_pantoIndex;
}

void Panto::setInTransition(bool inTransition){
    m_inTransition = inTransition;
}

bool Panto::getInTransition(){
    return m_inTransition;
}

bool Panto::getIsFrozen(){
    return m_isFrozen;
}
void Panto::setIsFrozen(bool isFrozen){
    m_isFrozen = isFrozen;
}
