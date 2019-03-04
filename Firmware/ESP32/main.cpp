#include "panto.hpp"
#include "serial.hpp"
#include "task.hpp"
#include "physics/pantoPhysics.hpp"

unsigned long prevTime = 0;

void ioLoop()
{
    DPSerial::receive();
    auto connected = DPSerial::ensureConnection();

    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].readEncoders();
        pantos[i].forwardKinematics();
    }

    // if (connected)
    // {
    //     DPSerial::sendPosition();
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

    // https://forum.arduino.cc/index.php?topic=367154.0
    // http://playground.arduino.cc/Main/TimerPWMCheatsheet

    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].setup(i);
    }
    delay(1000);
    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].calibrationEnd();
    }

    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantoPhysics.emplace_back(&pantos[i]);
        pantoPhysics[i].addObstacle(std::vector<Vector2D>{
            Vector2D(-50, -80),
            Vector2D(50, -80)
        });
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
