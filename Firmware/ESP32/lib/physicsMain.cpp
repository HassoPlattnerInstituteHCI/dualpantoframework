#include "physicsMain.hpp"

#include "panto.hpp"
#include "performanceMonitor.hpp"
#include "physics/pantoPhysics.hpp"
#include "spiEncoder.hpp"

unsigned long prevTime = 0;

#ifdef LINKAGE_ENCODER_USE_SPI
SPIEncoderChain* spi;
#endif

void physicsSetup()
{
    #ifdef LINKAGE_ENCODER_USE_SPI
    spi = new SPIEncoderChain(numberOfSpiEncoders);
    #endif

    ulTaskNotifyTake(true, portMAX_DELAY);

    #ifdef LINKAGE_ENCODER_USE_SPI
    std::vector<uint16_t> startPositions(numberOfSpiEncoders);
    #endif
    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].calibrationEnd();
        #ifdef LINKAGE_ENCODER_USE_SPI
        for (unsigned char j = 0; j < 3; ++j)
        {
            auto index = encoderSpiIndex[i * 3 + j];
            if(index != 0xffffffff)
            {
                startPositions[index] = ((uint16_t)(pantos[i].actuationAngle[j] / (2.0 * PI) * encoderSteps[i * 3 + j]) & 0x3fff);
                pantos[i].angleAccessors[j] = spi->getAngleAccessor(index);
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
    PERFMON_START("[aa] Query SPI");
    #ifdef LINKAGE_ENCODER_USE_SPI
    spi->update();
    #endif
    PERFMON_STOP("[aa] Query SPI");

    PERFMON_START("[ab] Calculation loop");
    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        PERFMON_START("[aba] Actually read");
        pantos[i].readEncoders();
        PERFMON_STOP("[aba] Actually read");
        PERFMON_START("[abb] Calc fwd kinematics");
        pantos[i].forwardKinematics();
        PERFMON_STOP("[abb] Calc fwd kinematics");
    }
    PERFMON_STOP("[ab] Calculation loop");
    PERFMON_STOP("[a] Read encoders");

    PERFMON_START("[b] Calculate physics");
    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantoPhysics[i].step();
    }
    PERFMON_STOP("[b] Calculate physics");

    PERFMON_START("[c] Actuate motors");
    for (unsigned char i = 0; i < pantoCount; ++i)
        pantos[i].actuateMotors();
    PERFMON_STOP("[c] Actuate motors");
}
