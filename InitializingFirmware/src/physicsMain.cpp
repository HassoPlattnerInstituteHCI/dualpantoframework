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

float upperHandleInitRotation;
std::vector<uint16_t> calibrated_zeros;
bool calibrationFinished = false;
int printcounter = 0;

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
    DPSerial::sendInstantDebugLog("Please rotate the upper handle clockwise");
    Serial.println("Saved zero Positions");
    upperHandleInitRotation = pantos[0].getActuationAngle(2);
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
    if (!calibrationFinished && abs(currentUpperHandleAngle - upperHandleInitRotation) > 1){
        bool isInversed = (currentUpperHandleAngle - upperHandleInitRotation > 1);
        Serial.println(currentUpperHandleAngle);
        Serial.println("--------");
        Serial.println(upperHandleInitRotation);
        Serial.println(isInversed);
        uint32_t encoder_steps = isInversed? 810 : 271;
        CalibrationData cd = {calibrated_zeros[0], calibrated_zeros[1], calibrated_zeros[2], calibrated_zeros[3], encoder_steps, isInversed};
        saveCalibrationData(cd);
        calibrationFinished = true;
        DPSerial::sendInstantDebugLog("Calibration finished!");
        Serial.println("Calibration finished!");
    }
    if (printcounter > 10000){
        Serial.println(pantos[0].getActuationAngle(2));
        printcounter = 0;
    }
    printcounter++;

}
