#include "ioMain.hpp"

#include "framerateLimiter.hpp"
#include "panto.hpp"
#include "serial.hpp"
#include "taskRegistry.hpp"

FramerateLimiter sendLimiter(60);

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
    DPSerial::receive();
    auto connected = DPSerial::ensureConnection();

    if (connected && sendLimiter.step())
    {
        DPSerial::sendPosition();
    }
}
