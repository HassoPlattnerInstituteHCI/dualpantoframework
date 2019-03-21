#pragma once

#include "collider.hpp"

class Obstacle : public Collider
{
private:
    bool m_enabled = true;
public:
    Obstacle(std::vector<Vector2D> points);
    Vector2D handleCollision(Vector2D targetPoint, Vector2D position);
    bool enabled();
    void enable(bool enable = true);
};
