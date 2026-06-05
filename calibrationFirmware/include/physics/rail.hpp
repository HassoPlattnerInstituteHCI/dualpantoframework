#pragma once

#include "physics/obstacle.hpp"

class Rail : public Obstacle
{

private:
    uint32_t displacement; // orthogonal distance to the rail until where the user still feels the applied force of the rail

public:
    Rail(std::vector<Vector2D> points, double displacement);
    virtual bool contains(Vector2D point);
};
