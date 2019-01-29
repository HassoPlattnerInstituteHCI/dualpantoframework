#pragma once

#include <Arduino.h>

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
