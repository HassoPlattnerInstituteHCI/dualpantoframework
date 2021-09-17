#include <utility>
#include <Arduino.h> //do we need this?
#include "ioMain.hpp"
#include "physicsMain.hpp"
#include "tasks/taskRegistry.hpp"
#include "utils/serial.hpp"

#include <cstdlib>
#include <new>

void *operator new(size_t size) noexcept { return ps_malloc(size); }
void operator delete(void *p) noexcept { free(p); }
void *operator new[](size_t size) noexcept { return operator new(size); }
void operator delete[](void *p) noexcept { operator delete(p); }
void *operator new(size_t size, std::nothrow_t) noexcept { return operator new(size); }
void operator delete(void *p, std::nothrow_t) noexcept { operator delete(p); }
void *operator new[](size_t size, std::nothrow_t) noexcept { return operator new(size); }
void operator delete[](void *p, std::nothrow_t) noexcept { operator delete(p); }


void setup()
{
    psramInit();
    Serial.begin(115200);
    bool ramFound = psramInit();
    log_d("Ram found %d", ramFound);
    DPSerial::init();
    DPSerial::sendInstantDebugLog("========== START ==========");
    Tasks.emplace(
        std::piecewise_construct,
        std::forward_as_tuple("I/O"), 
        std::forward_as_tuple(&ioSetup, &ioLoop, "I/O", 0));
    Tasks.at("I/O").run();
    Tasks.at("I/O").setLogFps();
    Tasks.emplace(
        std::piecewise_construct,
        std::forward_as_tuple("Physics"),
        std::forward_as_tuple(&physicsSetup, &physicsLoop, "Physics", 1));
    Tasks.at("Physics").run();
    
    TaskHandle_t defaultTask = xTaskGetCurrentTaskHandle();
    DPSerial::sendInstantDebugLog("default task handle is %i", defaultTask);
    vTaskSuspend(NULL);
    taskYIELD();
    DPSerial::sendInstantDebugLog("setup - this should not be printed");
}

void loop()
{
    DPSerial::sendInstantDebugLog("loop - this should not be printed");
    delay(1000);
}
