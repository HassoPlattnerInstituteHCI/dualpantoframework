#include "utils/vector.hpp"

#include <Arduino.h>

Vector2D Vector2D::fromPolar(double angle, double length)
{
    return Vector2D(cos(angle) * length, sin(angle) * length);
};

double Vector2D::determinant(const Vector2D& first, const Vector2D& second)
{
    return (first.x * second.y) - (first.y * second.x);
};

double Vector2D::length() const
{
    return sqrt(x * x + y * y);
};

double Vector2D::angle() const
{
    return atan2(y, x);
};

Vector2D Vector2D::operator+(const Vector2D& other) const
{
    return Vector2D(x + other.x, y + other.y);
};

Vector2D Vector2D::operator-(const Vector2D& other) const
{
    return Vector2D(x - other.x, y - other.y);
};

double Vector2D::operator*(const Vector2D& other) const
{
    return x * other.x + y * other.y;
};

Vector2D Vector2D::operator*(const double scale) const
{
    return Vector2D(x * scale, y * scale);
};

bool Vector2D::operator==(const Vector2D &other) const
{
    return x == other.x && y == other.y;
};