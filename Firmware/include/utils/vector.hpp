#pragma once

struct Vector2D
{
    double x, y;

    Vector2D() {}
    Vector2D(double _x, double _y) : x(_x), y(_y) {}

    static Vector2D fromPolar(double angle, double length);
    static double determinant(const Vector2D& first, const Vector2D& second);
    double length() const;
    double angle() const;
    Vector2D operator+(const Vector2D &other) const;
    Vector2D operator-(const Vector2D &other) const;
    double operator*(const Vector2D &other) const;
    Vector2D operator*(const double scale) const;
};
