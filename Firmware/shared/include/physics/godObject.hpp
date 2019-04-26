#pragma once

#include <Arduino.h>
#include <map>
#include <vector>

#include "indexedEdge.hpp"
#include "obstacle.hpp"
#include "panto.hpp"
#include "quadtree/quadtree.hpp"
#include "utils.hpp"

class GodObject
{
private:
    Vector2D m_position;
    Vector2D m_movementDirection;
    Vector2D m_activeForce;
    std::map<uint16_t, Obstacle> m_obstacles;
    Quadtree m_quadtree;
    portMUX_TYPE m_obstacleMutex;
    bool m_processingObstacleCollision;
    bool m_doneColliding;
    Vector2D m_lastError;
public:
    GodObject(Panto* panto, Vector2D position = Vector2D());
    void setMovementDirection(Vector2D movementDirection);
    void updateQuadtree();
    void dumpQuadtree();
    void move();
    std::vector<IndexedEdge> checkObstacleCollisions(Vector2D point);
    void createObstacle(uint16_t id, std::vector<Vector2D> points);
    void addToObstacle(uint16_t id, std::vector<Vector2D> points);
    void removeObstacle(uint16_t id);
    void enableObstacle(uint16_t id, bool enable = true);
    Vector2D getPosition();
    Vector2D getActiveForce();
    bool getProcessingObstacleCollision();
    bool getDoneColliding();
};
