#include "physics/rail.hpp"

#include "physics/obstacle.hpp"

Rail::Rail(std::vector<Vector2D> points) : Obstacle(points) {}

bool Rail::isOvercome(Vector2D target)
{
    // rails are overcome if the target is not within the area of the rail
    return (!contains(target));
}