#include "ioMain.hpp"

#include "hardware/panto.hpp"
#include "utils/framerateLimiter.hpp"
#include "utils/performanceMonitor.hpp"
#include "utils/serial.hpp"

FramerateLimiter sendLimiter = FramerateLimiter::fromFPS(60);
//todo copy limiter to physics physicsMain.cpp for SPI error logging

void ioSetup()
{
    ulTaskNotifyTake(true, portMAX_DELAY);
    delay(100); // TODO: patch: wait until pantoPhysics instantiates godobject (physicsMain);
}

void ioLoop()
{
    PERFMON_START("[a] Receive serial");
    DPSerial::receive();
    auto connected = DPSerial::ensureConnection();
    PERFMON_STOP("[a] Receive serial");

    PERFMON_START("[b] Send positions");
    //DPSerial::sendDebugData();
    //DPSerial::sendInstantDebugLog("\n");
    if (connected && sendLimiter.step())
    {
        DPSerial::sendPosition();
    }
    PERFMON_STOP("[b] Send positions");
    
    PERFMON_START("[c] Send debug logs");
    if (connected)
    {
        DPSerial::processDebugLogQueue();
    }
    PERFMON_STOP("[c] Send debug logs");
}
