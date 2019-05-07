#include "ioMain.hpp"

#include "framerateLimiter.hpp"
#include "panto.hpp"
#include "performanceMonitor.hpp"
#include "serial.hpp"
#include "taskRegistry.hpp"

FramerateLimiter sendLimiter = FramerateLimiter::fromFPS(60);

void ioSetup()
{
    for (unsigned char i = 0; i < pantoCount; ++i)
    {
        pantos[i].setup(i);
    }
    delay(1000);

    xTaskNotifyGive(Tasks.at("Physics").getHandle());
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
