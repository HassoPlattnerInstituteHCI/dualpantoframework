#include "physicsMain.hpp"

#include "hardware/panto.hpp"
#include "hardware/spiEncoderChain.hpp"
#include "physics/pantoPhysics.hpp"
#include "tasks/taskRegistry.hpp"
#include "utils/performanceMonitor.hpp"
#include "utils/framerateLimiter.hpp"
#include "utils/serial.hpp"

FramerateLimiter spiErrorLimiter = FramerateLimiter::fromSeconds(1);

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
    #endif
    
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

    PERFMON_START("[b] Calculate physics");
    for (auto i = 0; i < pantoCount; ++i)
    {
        pantoPhysics[i].step();
    }
    PERFMON_STOP("[b] Calculate physics");

    PERFMON_START("[c] Actuate motors");
    for (auto i = 0; i < pantoCount; ++i)
    {
        pantos[i].actuateMotors();
    }
    PERFMON_STOP("[c] Actuate motors");

    if(spiErrorLimiter.step()) {
        // DPSerial::sendQueuedDebugLog("SPI Errors: %i out of %i requests", spi->getErrors(), spi->getRequests());
        // for(int i=0; i < 2; i++){
        // DPSerial::sendQueuedDebugLog("Encoder Errors panto[0][%i]: %i out of %i requests",i,
        //     pantos[0].getEncoderErrorCounts(i), pantos[0].getEncoderRequestsCounts(i));
        // }
        // for(int i=0; i < 2; i++){
        // DPSerial::sendQueuedDebugLog("Encoder Errors panto[1][%i]: %i out of %i requests",i,
        //     pantos[1].getEncoderErrorCounts(i), pantos[1].getEncoderRequestsCounts(i));
        // }
        // spi->resetErrors();
    }
  
    PERFMON_START("[d] Calibrate Pantos");
    bool flag = false;
    for(auto i = 0; i < pantoCount; ++i){
        if(pantos[i].getCalibrationState()){
            flag = true;
            break;
        }
    }
    if(flag){
        #ifdef LINKAGE_ENCODER_USE_SPI
        std::vector<uint16_t> startPositions(numberOfSpiEncoders);
        #endif
        for (auto i = 0; i < pantoCount; ++i)
        {
            pantos[i].calibrationEnd();
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
                }
            }
            #endif
        }
        #ifdef LINKAGE_ENCODER_USE_SPI
        spi->setPosition(startPositions);
        #endif
    }
    PERFMON_STOP("[d] Calibrate Pantos");
}
