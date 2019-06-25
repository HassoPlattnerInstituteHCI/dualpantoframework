#include "ioMain.hpp"

#include "framerateLimiter.hpp"
#include "panto.hpp"
#include "performanceMonitor.hpp"
#include "serial.hpp"

FramerateLimiter sendLimiter = FramerateLimiter::fromFPS(60);

void ioSetup()
{
    ulTaskNotifyTake(true, portMAX_DELAY);
}

void ioLoop()
{
    PERFMON_START("[a] Receive serial");
    DPSerial::receive();
    auto connected = DPSerial::ensureConnection();
    PERFMON_STOP("[a] Receive serial");

    PERFMON_START("[b] Send positions");
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
