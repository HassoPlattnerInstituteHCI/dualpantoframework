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
    //DPSerial::sendDebugLog("hello, this is ioLoop");
    DPSerial::receive();
    auto connected = DPSerial::ensureConnection();

    //DPSerial::sendDebugLog("update");
    #ifdef LINKAGE_ENCODER_USE_SPI
    spi->update();
    // uint16_t t1, t2;
    // spi->m_spi.beginTransaction(SPISettings(1000000, SPI_MSBFIRST, SPI_MODE1));
    // digitalWrite(15, LOW);
    // spi->m_spi.transfer16(0xffff);
    // spi->m_spi.transfer16(0xffff);
    // digitalWrite(15, HIGH);
    // delayMicroseconds(1);
    // digitalWrite(15, LOW);
    // t1 = spi->m_spi.transfer16(0x0);
    // t2 = spi->m_spi.transfer16(0x0);
    // digitalWrite(15, HIGH);
    // spi->m_spi.endTransaction();
    // DPSerial::sendDebugLog("%04X %04X", t1 & 0x4000, t2 & 0x4000);
    // delay(1);
    #endif

    //DPSerial::sendDebugLog("kinematics");
    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].readEncoders();
        pantos[i].forwardKinematics();
    }

    if (connected)
    {
        DPSerial::sendDebugData();
    }

    //DPSerial::sendDebugLog("actuate");
    unsigned long now = micros();
    Panto::dt = now - prevTime;
    prevTime = now;
    for (unsigned char i = 0; i < pantoCount; ++i)
        pantos[i].actuateMotors();
}

void physicsLoop()
{
    //DPSerial::sendDebugLog("hello, this is physicsLoop");
    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        //DPSerial::sendDebugLog("hphsyics for %i", i);
        //pantoPhysics[i].step();
    }
    delay(1000);
}

void setup()
{
    BOARD_DEPENDENT_SERIAL.begin(115200);

    DPSerial::sendDebugLog("========== START ==========");
    DPSerial::sendDebugLog("creating spi...");

    // https://forum.arduino.cc/index.php?topic=367154.0
    // http://playground.arduino.cc/Main/TimerPWMCheatsheet

    #ifdef LINKAGE_ENCODER_USE_SPI
    spi = new SPIEncoderChain(numberOfSpiEncoders);
    #endif

    DPSerial::sendDebugLog("init pantos...");

    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].setup(i);
    }
    delay(1000);
    #ifdef LINKAGE_ENCODER_USE_SPI
    std::vector<uint16_t> startPositions;
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
                DPSerial::sendDebugLog("valid index %i %i %i", i, j, index);
                DPSerial::sendDebugLog("aa %f es %i", pantos[i].actuationAngle[j], encoderSteps[i * 3 + j]);
                startPositions.push_back((uint16_t)(pantos[i].actuationAngle[j] / (2.0 * PI) * encoderSteps[i * 3 + j]) & 0x3fff);
                pantos[i].angleAccessors[j] = spi->getAngleAccessor(index);
            }
            else
            {
                DPSerial::sendDebugLog("invalid index %i %i %i", i, j, index);
            }
            
        }
        #endif
    }
    #ifdef LINKAGE_ENCODER_USE_SPI
    spi->setPosition(startPositions);
    #endif

    std::vector<Vector2D> path{
        Vector2D(-50, -80),
        Vector2D(50, -80)
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
