#include "panto.hpp"
#include "serial.hpp"

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
}

void loop()
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
