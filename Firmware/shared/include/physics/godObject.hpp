#pragma once

#include <Arduino.h>
#include <vector>
#include <map>
#include "utils.hpp"
#include "collision.hpp"
#include "obstacle.hpp"

class GodObject
{
private:
    Vector2D m_position;
    Vector2D m_movementDirection;
    Vector2D m_activeForce;
    std::map<uint16_t, Obstacle> m_obstacles;
    portMUX_TYPE m_obstacleMutex;
    bool m_processingObstacleCollision;
    bool m_doneColliding;
    static const double c_bigPantoForceScale;
    static const double c_smallPantoForceScale;
public:
    GodObject(Vector2D position = Vector2D());
    void setMovementDirection(Vector2D movementDirection);
    void move();
    std::vector<Collision> checkObstacleCollisions(Vector2D point);
    void addObstacle(uint16_t id, std::vector<Vector2D> points);
    void removeObstacle(uint16_t id);
    void enableObstacle(uint16_t id, bool enable = true);
    Vector2D getPosition();
    Vector2D getActiveForce();
    bool getProcessingObstacleCollision();
    bool getDoneColliding();
};
