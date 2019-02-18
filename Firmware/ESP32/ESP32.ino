#include "panto.hpp"
#include "serial.hpp"

unsigned long prevTime = 0;

TaskHandle_t core0LoopTask;
TaskHandle_t core1LoopTask;

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

    DPSerial::sendDebugLog("starting task 0");
    createTask(core0Loop, core0LoopTask, 0);
    DPSerial::sendDebugLog("starting task 1");
    createTask(core1Loop, core1LoopTask, 1);
    DPSerial::sendDebugLog("started tasks");

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
