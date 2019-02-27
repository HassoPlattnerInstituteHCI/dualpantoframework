#pragma once

#include <vector>
#include "utils.hpp"
#include "collision.hpp"
#include "obstacle.hpp"

class GodObject
{
private:
    Vector2D m_position;
    Vector2D m_movementDirection;
    Vector2D m_activeForce;
    std::vector<Obstacle> m_obstacles;
    bool m_processingObstacleCollision;
    bool m_doneColliding;
    const float c_bigPantoForceScale = 0.1125;
    const float c_smallPantoForceScale = 0.125;
public:
    GodObject(Vector2D position = Vector2D());
    void setMovementDirection(Vector2D movementDirection);
    void move();
    std::vector<Collision> checkObstacleCollisions(Vector2D point);
    void addObstacle(Obstacle obstacle);
    void removeObstacle(Obstacle obstacle);
};