#include "hardware/panto.hpp"

#include <vector>

#include "utils/performanceMonitor.hpp"
#include "utils/serial.hpp"

std::vector<Panto> pantos;

void Panto::forwardKinematics()
{
    // base angles
    // PERFMON_START("[abba] base angles");
    const auto leftBaseAngle = m_actuationAngle[c_localLeftIndex];
    const auto rightBaseAngle = m_actuationAngle[c_localRightIndex];
    const auto handleAngle = m_actuationAngle[c_localHandleIndex];
    // PERFMON_STOP("[abba] base angles");

    // base angle sin / cos
    // PERFMON_START("[abbb] base angle sin / cos");
    const auto leftBaseAngleSin = std::sin(leftBaseAngle);
    const auto leftBaseAngleCos = std::cos(leftBaseAngle);
    // PERFMON_STOP("[abbb] base angle sin / cos");

    // calculate inner positions
    // PERFMON_START("[abbc] calculate inner positions");
    const auto leftInnerX =
        fmaf(leftBaseAngleCos, c_leftInnerLength, c_leftBaseX);
    const auto leftInnerY =
        fmaf(leftBaseAngleSin, c_leftInnerLength, c_leftBaseY);
    const auto rightInnerX =
        fmaf(std::cos(rightBaseAngle), c_rightInnerLength, c_rightBaseX);
    const auto rightInnerY =
        fmaf(std::sin(rightBaseAngle), c_rightInnerLength, c_rightBaseY);
    // PERFMON_STOP("[abbc] calculate inner positions");

    // diagonal between inner positions
    // PERFMON_START("[abbd] diagonal between inner positions");
    const auto diagonalX = rightInnerX - leftInnerX;
    const auto diagonalY = rightInnerY - leftInnerY;
    const auto diagonalSquared = diagonalX * diagonalX + diagonalY * diagonalY;
    const auto diagonalLength = std::sqrt(diagonalSquared);
    // PERFMON_STOP("[abbd] diagonal between inner positions");

    // left elbow angles
    // - inside is between diagonal and linkage
    // - offset is between zero and diagonal
    // - total is between zero and linkage
    // PERFMON_START("[abbe] left elbow angles");
    const auto leftElbowInsideAngleCos =
        (diagonalSquared +
        c_leftOuterLengthSquaredMinusRightOuterLengthSquared) /
        (2 * diagonalLength * c_leftOuterLength);
    const auto leftElbowInsideAngle = -std::acos(leftElbowInsideAngleCos);
    const auto leftElbowOffsetAngle = std::atan2(diagonalY, diagonalX);
    const auto leftElbowTotalAngle =
        leftElbowInsideAngle + leftElbowOffsetAngle;
    // PERFMON_STOP("[abbe] left elbow angles");

    // left elbow angle sin / cos
    // PERFMON_START("[abbf] left elbow angle sin / cos");
    const auto leftElbowTotalAngleSin =
        std::sin(leftElbowTotalAngle);
    const auto leftElbowTotalAngleCos =
        std::cos(leftElbowTotalAngle);
    // PERFMON_STOP("[abbf] left elbow angle sin / cos");

    // handle position
    // PERFMON_START("[abbg] handle position");
    m_handleX =
        fmaf(leftElbowTotalAngleCos, c_leftOuterLength, leftInnerX);
    m_handleY =
        fmaf(leftElbowTotalAngleSin, c_leftOuterLength, leftInnerY);
    // PERFMON_STOP("[abbg] handle position");

    // right elbow angles
    // PERFMON_START("[abbh] right elbow angles");
    const auto rightDiffX = m_handleX - rightInnerX;
    const auto rightDiffY = m_handleY - rightInnerY;
    const auto rightElbowTotalAngle = std::atan2(rightDiffY, rightDiffX);
    // PERFMON_STOP("[abbh] right elbow angles");

    // store angles
    // PERFMON_START("[abbi] store angles");
    m_leftInnerAngle = leftElbowTotalAngle;
    m_rightInnerAngle = rightElbowTotalAngle;
    m_pointingAngle =
        handleAngle +
        (encoderFlipped[c_globalHandleIndex]==1? -1 : 1)* //sign changes when encoder is flipped
        (c_handleMountedOnRightArm==1 ?       
        (-rightElbowTotalAngle) :
        (leftElbowTotalAngle));
    
    // PERFMON_STOP("[abbi] store angles");

    // some weird diffs and their sinuses
    // PERFMON_START("[abbj] some weird diffs and their sinuses");
    const auto rightElbowTotalAngleMinusLeftBaseAngle =
        rightElbowTotalAngle - leftBaseAngle;
    const auto rightElbowTotalAngleMinusLeftBaseAngleSin =
        std::sin(rightElbowTotalAngleMinusLeftBaseAngle);
    const auto rightElbowTotalAngleMinusRightBaseAngle =
        rightElbowTotalAngle - rightBaseAngle;
    const auto rightElbowTotalAngleMinusRightBaseAngleSin =
        std::sin(rightElbowTotalAngleMinusRightBaseAngle);
    const auto leftElbowTotalAngleMinusRightElbowTotalAngle =
        leftElbowTotalAngle - rightElbowTotalAngle;
    const auto leftElbowTotalAngleMinusRightElbowTotalAngleSin =
        std::sin(leftElbowTotalAngleMinusRightElbowTotalAngle);
    // PERFMON_STOP("[abbj] some weird diffs and their sinuses");

    // shared factors for rows/columns
    // PERFMON_START("[abbk] shared factors for rows/columns");
    const auto upperRow =
        c_leftInnerLength * rightElbowTotalAngleMinusLeftBaseAngleSin;
    const auto lowerRow =
        c_rightInnerLength * rightElbowTotalAngleMinusRightBaseAngleSin;
    const auto leftColumn =
        leftElbowTotalAngleSin /
        leftElbowTotalAngleMinusRightElbowTotalAngleSin;
    const auto rightColumn =
        leftElbowTotalAngleCos /
        leftElbowTotalAngleMinusRightElbowTotalAngleSin;
    // PERFMON_STOP("[abbk] shared factors for rows/columns");

    // set jacobian matrix
    // PERFMON_START("[abbl] set jacobian matrix");
    m_jacobian[0][0] =
        (-c_leftInnerLength * leftBaseAngleSin) - (upperRow * leftColumn);
    m_jacobian[0][1] =
        (c_leftInnerLength * leftBaseAngleCos) + (upperRow * rightColumn);
    m_jacobian[1][0] =
        lowerRow * leftColumn;
    m_jacobian[1][1] =
        -lowerRow * rightColumn;
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
        m_targetAngle[c_localLeftIndex] =
            m_jacobian[0][0] * m_targetX +
            m_jacobian[0][1] * m_targetY;
        m_targetAngle[c_localRightIndex] =
            m_jacobian[1][0] * m_targetX +
            m_jacobian[1][1] * m_targetY;
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
            DPSerial::sendTransitionEnded(getPantoIndex());
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
        m_previousAngle[localIndex] =
            ensureAngleRange(
                encoderFlipped[globalIndex] *
                TWO_PI * m_angleAccessors[localIndex]() /
                encoderSteps[globalIndex]);
        m_encoderRequestCount++;
        m_encoderRequestCounts[localIndex]++;
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
            float std = 0.0f;
            float mean = 0.0f;
            for(int i = 0; i < 5; i++){
                mean+=m_previousAngles[localIndex][i];
            }mean/=5.0f;
            for(int i = 0; i < 5; i++){
                std+=(m_previousAngles[localIndex][i]-mean)*(m_previousAngles[localIndex][i]-mean);
            }std /=5.0f;
            if(std < 1.0f){
                m_actuationAngle[localIndex] = m_previousAngles[localIndex][4];
            }
            else{
                m_encoderErrorCounts[localIndex]++;
                // DPSerial::sendQueuedDebugLog("jumps at [panto %d][motor %d] (std>1.0f) mean = %f",c_pantoIndex, localIndex, mean);
                // for(int i = 0; i < 5; i++){
                //  DPSerial::sendQueuedDebugLog("previousAngles[%d][%d]=%f",localIndex, i, m_previousAngles[localIndex][i]);
                // }
                // m_actuationAngle[localIndex] = m_previousAngle[localIndex];
            }
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
};

void Panto::calibrateEncoders(){
    #ifdef LINKAGE_ENCODER_USE_SPI
    for (auto localIndex = 0; localIndex < c_dofCount - 1; ++localIndex)
    {   
        //Write encoder values to EEPROM
        EEPROM.writeInt((3*c_pantoIndex*sizeof(uint32_t)+localIndex*sizeof(uint32_t)),m_angleAccessors[localIndex]());
    }
    #endif
}

void Panto::resetActuationAngle(){
   for (auto localIndex = 0; localIndex < c_dofCount; ++localIndex){
    const auto globalIndex = c_globalIndexOffset + localIndex;
    m_actuationAngle[localIndex] = setupAngle[globalIndex] * TWO_PI;
   }
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
        if (m_encoder[localIndex])
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
