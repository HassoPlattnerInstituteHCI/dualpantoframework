#include "config.hpp"
#include "panto.hpp"
#include "serial.hpp"
#include "task.hpp"
#include "physics/pantoPhysics.hpp"
#include <SPI.h>
#include "spiEncoder.hpp"

unsigned long prevTime = 0;
#ifdef LINKAGE_ENCODER_USE_SPI
SPIEncoderChain* spi;
#endif

void ioLoop()
{
    DPSerial::receive();
    auto connected = DPSerial::ensureConnection();

    #ifdef LINKAGE_ENCODER_USE_SPI
    spi->update();
    #endif

    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].readEncoders();
        pantos[i].forwardKinematics();
    }

    // if (connected)
    // {
    //     DPSerial::sendDebugData();
    // }

    unsigned long now = micros();
    Panto::dt = now - prevTime;
    prevTime = now;
    for (unsigned char i = 0; i < pantoCount; ++i)
        pantos[i].actuateMotors();
}

void physicsLoop()
{
    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantoPhysics[i].step();
    }
}

void setup()
{
    BOARD_DEPENDENT_SERIAL.begin(115200);

    DPSerial::sendDebugLog("========== START ==========");

    // https://forum.arduino.cc/index.php?topic=367154.0
    // http://playground.arduino.cc/Main/TimerPWMCheatsheet

    #ifdef LINKAGE_ENCODER_USE_SPI
    spi = new SPIEncoderChain(numberOfSpiEncoders);
    #endif

    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].setup(i);
    }
    delay(1000);
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

    std::vector<Vector2D> path{
        Vector2D(-100, -140),
        Vector2D(100, -140)
    };
    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantoPhysics.emplace_back(&pantos[i]);
        pantoPhysics[i].addObstacle(path);
    }

    prevTime = micros();

    Task ioTask = Task(&ioLoop, "I/O", 0);
    ioTask.run();
    ioTask.setLogFps();
    Task physicsTask = Task(&physicsLoop, "Physics", 1);
    physicsTask.run();

    TaskHandle_t defaultTask = xTaskGetCurrentTaskHandle();
    DPSerial::sendDebugLog("default task handle is %i", defaultTask);
    vTaskSuspend(NULL);
    taskYIELD();
    DPSerial::sendDebugLog("setup - this should not be printed");
}

void loop()
{
    DPSerial::sendDebugLog("loop - this should not be printed");
    delay(1000);
}
