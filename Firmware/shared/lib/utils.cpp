#include "utils.hpp"

Vector2D Vector2D::fromPolar(float angle, float length)
{
    return Vector2D(cos(angle) * length, sin(angle) * length);
};

float Vector2D::length()
{
    return sqrt(x * x + y * y);
};

float Vector2D::angle()
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

float Vector2D::operator*(const Vector2D &other)
{
    return x * other.x + y * other.y;
};

Vector2D Vector2D::operator*(const float scale)
{
    return Vector2D(x * scale, y * scale);
};

float determinant(Vector2D first, Vector2D second)
{
    return (first.x * second.y) - (first.y * second.x);
};
