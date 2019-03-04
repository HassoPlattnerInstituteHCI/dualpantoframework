#pragma once

#include "collider.hpp"

class Obstacle : public Collider
{
public:
    Obstacle(std::vector<Vector2D> points);
    Vector2D handleCollision(Vector2D targetPoint, Vector2D position);
};