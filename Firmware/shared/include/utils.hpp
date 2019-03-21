#pragma once

#include <Arduino.h>

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
    Vector2D operator*(const float scale);
};

float determinant(Vector2D first, Vector2D second);
