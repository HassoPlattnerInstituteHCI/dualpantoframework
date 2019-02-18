#pragma once

#include <Arduino.h>

const uint32_t c_taskFPSInterval = 5000;
const uint32_t c_taskStackSize = 8192;
const uint32_t c_taskPriority = 1;
#define createTask(loopFunc, taskHandle, core) xTaskCreatePinnedToCore([](void *){ \
/* setup counter */ uint32_t t = millis(), u, l = 0; \
/* call function */ _: loopFunc(); \
/* check counter */ ++l; u=millis(); if(u>=t+c_taskFPSInterval){DPSerial::sendDebugLog("%s fps: %i", #taskHandle, l*1000/c_taskFPSInterval); t=u; l=0;} \
/* evil goto :^) */ goto _; \
}, #taskHandle, c_taskStackSize, NULL, c_taskPriority, &taskHandle, core)

float clamp(float value, float min, float max);

struct Vector2D
{
    float x, y;

    Vector2D() {}
    Vector2D(float _x, float _y) : x(_x), y(_y) {}

    static Vector2D fromPolar(float angle, float length);
    float length();
    float angle();
    Vector2D operator+(const Vector2D &other);
    Vector2D operator-(const Vector2D &other);
    float operator*(const Vector2D &other);
};
