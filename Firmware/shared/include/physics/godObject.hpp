#pragma once

#include <Arduino.h>
#include <map>
#include <set>
#include <vector>

#include "indexedEdge.hpp"
#include "obstacle.hpp"
#include "panto.hpp"
#include "hashtable.hpp"
#include "utils.hpp"

class GodObject
{
private:
    static constexpr double c_resolveDistance = 0.01;
    Vector2D m_position;
    Vector2D m_movementDirection;
    Vector2D m_activeForce;
    std::map<uint16_t, Obstacle> m_obstacles;
    Hashtable m_hashtable;
    portMUX_TYPE m_obstacleMutex;
    bool m_processingObstacleCollision;
    bool m_doneColliding;
    Vector2D m_lastError;
public:
    GodObject(Panto* panto, Vector2D position = Vector2D());
    void setMovementDirection(Vector2D movementDirection);
    void updateHashtable();
    void dumpHashtable();
    void move();
    Vector2D checkCollisions(Vector2D targetPoint);
    void createObstacle(uint16_t id, std::vector<Vector2D> points);
    void addToObstacle(uint16_t id, std::vector<Vector2D> points);
    void removeObstacle(uint16_t id);
    void enableObstacle(uint16_t id, bool enable = true);
    Vector2D getPosition();
    Vector2D getActiveForce();
    bool getProcessingObstacleCollision();
    bool getDoneColliding();
};
