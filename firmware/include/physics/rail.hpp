#pragma once

#include "physics/obstacle.hpp"

class Rail : public Obstacle
{

private:
    uint32_t displacement;

public:
    Rail(std::vector<Vector2D> points, double displacement);
    virtual bool contains(Vector2D point);
};
