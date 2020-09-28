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

Vector2D Vector2D::normalize() const 
{
    return Vector2D(x / length(), y / length());
}

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

bool Vector2D::operator!=(const Vector2D &other) const
{
    return x != other.x || y != other.y;
};

double Vector2D::distancePointToLineSegment(Vector2D a, Vector2D b) {
    // a is the start of the line segment, b is the end
    // distance is measured from the point p
    Vector2D ab = b - a;
    Vector2D ae = *this - a;
    Vector2D be = *this - b;

    double ab_ae = ab * ae;
    double ab_be = ab * be;

    if (ab_be > 0){
        // Point is above line segment
        return be.length();
    } else if (ab_ae < 0) {
        // Point is below line segment
        return ae.length();
    } else {
         // Finding the perpendicular distance 
        double x1 = ab.x; 
        double y1 = ab.y; 
        double x2 = ae.x; 
        double y2 = ae.y; 
        double mod = sqrt(x1 * x1 + y1 * y1); 
        return abs(x1 * y2 - y1 * x2) / mod; 
    }
}