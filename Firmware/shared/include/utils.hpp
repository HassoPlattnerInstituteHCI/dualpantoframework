#pragma once

struct Vector2D
{
    double x, y;

    Vector2D() {}
    Vector2D(double _x, double _y) : x(_x), y(_y) {}

    static Vector2D fromPolar(double angle, double length);
    double length();
    double angle();
    Vector2D operator+(const Vector2D &other);
    Vector2D operator-(const Vector2D &other);
    double operator*(const Vector2D &other);
    Vector2D operator*(const double scale);
};

double determinant(Vector2D first, Vector2D second);
