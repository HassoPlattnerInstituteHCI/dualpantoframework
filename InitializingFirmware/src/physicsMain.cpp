#include "physicsMain.hpp"

#include "hardware/panto.hpp"
#include "hardware/spiEncoderChain.hpp"
#include "physics/pantoPhysics.hpp"
#include "tasks/taskRegistry.hpp"
#include "utils/performanceMonitor.hpp"
#include "utils/framerateLimiter.hpp"
#include "utils/serial.hpp"
#include "hardware/calibration.hpp"

FramerateLimiter spiErrorLimiter = FramerateLimiter::fromSeconds(1);

std::vector<uint16_t> calibrated_zeros;
bool calibratedUpperHandle = false;
bool calibratedLowerHandle = false;
bool calibrationFinished = false;
int printcounter = 0;
bool isInversedUpper;
bool isInversedLower;
uint32_t encoder_steps_upper;
uint32_t encoder_steps_lower;
float upperHandleMaxAngle;
float lowerHandleMaxAngle;

#ifdef LINKAGE_ENCODER_USE_SPI
SPIEncoderChain* spi;
#endif

void physicsSetup()
{
    #ifdef LINKAGE_ENCODER_USE_SPI
    spi = new SPIEncoderChain(numberOfSpiEncoders);
    #endif

    for (auto i = 0; i < pantoCount; ++i)
    {
        pantos.emplace_back(i);
    }
    delay(1000);

    xTaskNotifyGive(Tasks.at("I/O").getHandle());

    #ifdef LINKAGE_ENCODER_USE_SPI
    std::vector<uint16_t> startPositions(numberOfSpiEncoders);
    #endif

    EEPROM.begin(sizeof(uint32_t)*numberOfSpiEncoders);

    //calibrateEncoders; Comment if not needed
    // for (auto i = 0; i < pantoCount; ++i)
    // { pantos[i].calibrateEncoders(i);}

    for (auto i = 0; i < pantoCount; ++i)
    {
        pantos[i].calibrationEnd(); //calibrating only handle pulse encoder
        #ifdef LINKAGE_ENCODER_USE_SPI
        for (auto j = 0; j < 3; ++j) // three encoders
        {
            auto index = encoderSpiIndex[i * 3 + j];
            if(index != 0xffffffff) // excluding it / me handle.
            {
                startPositions[index] =
                ((uint16_t)(pantos[i].getActuationAngle(j) /
                (TWO_PI) *
                encoderSteps[i * 3 + j]) & 0x3fff);

                pantos[i].setAngleAccessor(j, spi->getAngleAccessor(index));
            }
        }
        #endif
    }
    #ifdef LINKAGE_ENCODER_USE_SPI
    spi->setPosition(startPositions);
    calibrated_zeros = spi->getZero();
    DPSerial::sendInstantDebugLog("saved zero positions");
    DPSerial::sendInstantDebugLog("Rotate both handles clockwise three times, than back a bit to confirm");
    #endif
    //digitalWrite(motorDirAPin[2], 1);
    //digitalWrite(motorDirBPin[globalIndex], !flippedDir);
    //ledcWrite(2, 0.1 * 4095);

    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantoPhysics.emplace_back(&pantos[i]);
    }

}

void physicsLoop()
{
    PERFMON_START("[a] Read encoders");
    // PERFMON_START("[aa] Query SPI");
    #ifdef LINKAGE_ENCODER_USE_SPI
    spi->update();
    #endif
    // PERFMON_STOP("[aa] Query SPI");

    // PERFMON_START("[ab] Calculation loop");
    for (auto i = 0; i < pantoCount; ++i)
    {
        // PERFMON_START("[aba] Actually read");
        pantos[i].readEncoders();
        // PERFMON_STOP("[aba] Actually read");
        PERFMON_START("[abb] Calc fwd kinematics");
        pantos[i].forwardKinematics();
        PERFMON_STOP("[abb] Calc fwd kinematics");
    }
    // PERFMON_STOP("[ab] Calculation loop");
    PERFMON_STOP("[a] Read encoders");

    float currentUpperHandleAngle = pantos[0].getActuationAngle(2);
    float currentLowerHandleAngle = pantos[1].getActuationAngle(2);
    upperHandleMaxAngle = max(abs(currentUpperHandleAngle), abs(upperHandleMaxAngle));
    lowerHandleMaxAngle = max(abs(currentLowerHandleAngle), abs(lowerHandleMaxAngle));

    if (!calibratedUpperHandle && (upperHandleMaxAngle - abs(currentUpperHandleAngle) > 0.5)) {
        isInversedUpper = (currentUpperHandleAngle > 1);
        Serial.println("----UPPER CALIBRATED----");
        encoder_steps_upper = isInversedUpper? (abs(upperHandleMaxAngle) < 2.3*TWO_PI ? 740 : 815) : (upperHandleMaxAngle < 0.87*TWO_PI ? 271 : 308);
        Serial.println(encoder_steps_upper);
        calibratedUpperHandle = true;
    }

    if (!calibratedLowerHandle && (lowerHandleMaxAngle - abs(currentLowerHandleAngle) > 0.5)){
        isInversedLower = (currentLowerHandleAngle > 1);
        Serial.println("----LOWER CALIBRATED----");
        encoder_steps_lower = isInversedLower? (abs(lowerHandleMaxAngle) < 2.3*TWO_PI ? 740 : 815) : (lowerHandleMaxAngle < 0.87*TWO_PI ? 271 : 308);
        Serial.println(encoder_steps_lower);
        calibratedLowerHandle = true;
    }

    if (calibratedUpperHandle && calibratedLowerHandle && !calibrationFinished){
        CalibrationData cd = {calibrated_zeros[0], calibrated_zeros[1], calibrated_zeros[2], calibrated_zeros[3], encoder_steps_upper, encoder_steps_lower, isInversedUpper, isInversedLower};
        saveCalibrationData(cd);
        DPSerial::sendInstantDebugLog("Calibration finished!");
        calibrationFinished = true;
    }

    if (printcounter > 10000){
        Serial.println(pantos[0].getActuationAngle(2));
        printcounter = 0;
    }
    printcounter++;

}
