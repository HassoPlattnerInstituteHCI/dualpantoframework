#include "utils.hpp"
#include <Arduino.h>

Vector2D Vector2D::fromPolar(double angle, double length)
{
    return Vector2D(cos(angle) * length, sin(angle) * length);
};

double Vector2D::length()
{
    return sqrt(x * x + y * y);
};

double Vector2D::angle()
{
    return atan2(y, x);
};

Vector2D Vector2D::operator+(const Vector2D &other)
{
    return Vector2D(x + other.x, y + other.y);
};

Vector2D Vector2D::operator-(const Vector2D &other)
{
    return Vector2D(x - other.x, y - other.y);
};

double Vector2D::operator*(const Vector2D &other)
{
    return x * other.x + y * other.y;
};

Vector2D Vector2D::operator*(const double scale)
{
    return Vector2D(x * scale, y * scale);
};

double determinant(Vector2D first, Vector2D second)
{
    return (first.x * second.y) - (first.y * second.x);
};
