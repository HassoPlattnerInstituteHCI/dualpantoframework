#include "panto.hpp"
#include "serial.hpp"
#include "task.hpp"

unsigned long prevTime = 0;

void setup()
{
    Serial.begin(115200);

    // https://forum.arduino.cc/index.php?topic=367154.0
    // http://playground.arduino.cc/Main/TimerPWMCheatsheet

    for (unsigned char i = 0; i < pantoCount; ++i)
        pantos[i].setup(i);
    delay(1000);
    for (unsigned char i = 0; i < pantoCount; ++i)
        pantos[i].calibrationEnd();

    prevTime = micros();

    Task ioTask = Task(&core0Loop, "I/O", 0);
    ioTask.run();
    Task physicsTask(&core1Loop, "Physics", 1);
    physicsTask.run();

    TaskHandle_t defaultTask = xTaskGetCurrentTaskHandle();
    DPSerial::sendDebugLog("default task handle is %i", defaultTask);
    vTaskSuspend(NULL);
    taskYIELD();
    DPSerial::sendDebugLog("setup - this should not be printed");
}

void core0Loop()
{
    DPSerial::receive();
    auto connected = DPSerial::ensureConnection();

    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].readEncoders();
        pantos[i].forwardKinematics();
    }

    if (connected)
    {
        DPSerial::sendPosition();
    }

    unsigned long now = micros();
    Panto::dt = now - prevTime;
    prevTime = now;
    for (unsigned char i = 0; i < pantoCount; ++i)
        pantos[i].actuateMotors();
}

void core1Loop()
{
    DPSerial::sendDebugLog("physics running on core %i - should be 1", xPortGetCoreID());
    delay(1000);
}

void loop()
{
    DPSerial::sendDebugLog("loop - this should not be printed");
    delay(1000);
}
