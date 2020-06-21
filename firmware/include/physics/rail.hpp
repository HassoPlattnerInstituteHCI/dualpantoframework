#pragma once

#include <tuple>
#include <vector>

#include "physics/obstacle.hpp"

class Rail : public Obstacle
{

public:
    Rail(std::vector<Vector2D> points);
    bool isOvercome(Vector2D target) override;
};
