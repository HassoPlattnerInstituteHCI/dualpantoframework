#include "obstacle.hpp"

Obstacle::Obstacle(std::vector<Vector2D> points) : Collider(points) { }

Vector2D Obstacle::handleCollision(Vector2D targetPoint, Vector2D position)
{
    auto collidingEdge = getEnteringEdge(targetPoint, position);
    return getClosestOutsidePoint(collidingEdge, targetPoint);
}