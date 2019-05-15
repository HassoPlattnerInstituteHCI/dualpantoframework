#include "physics/obstacle.hpp"

Obstacle::Obstacle(std::vector<Vector2D> points) : Collider(points) { }

Vector2D Obstacle::handleCollision(Vector2D targetPoint, Vector2D position)
{
    Edge collidingEdge;
    // ignore return value - we already know it's colliding
    getEnteringEdge(targetPoint, position, &collidingEdge);
    return getClosestOutsidePoint(collidingEdge, targetPoint);
}

bool Obstacle::enabled()
{
    return m_enabled;
}

void Obstacle::enable(bool enable)
{
    m_enabled = enable;
}
