#pragma once

#include <deque>
#include <map>
#include <set>
#include <vector>

#include "hardware/panto.hpp"
#include "physics/godObjectAction.hpp"
#include "physics/indexedEdge.hpp"
#include "physics/obstacle.hpp"
#include "physics/rail.hpp"
#include "physics/hashtable.hpp"
#include "utils/vector.hpp"

class GodObject
{
private:
    static constexpr double c_resolveDistance = 0.00001;
    Vector2D m_position;
    Vector2D m_movementDirection;
    Vector2D m_activeForce;
    std::map<uint16_t, Obstacle*> m_obstacles;
    Hashtable m_hashtable;
    portMUX_TYPE m_obstacleMutex;
    bool m_processingObstacleCollision;
    bool m_doneColliding;
    Vector2D m_lastError;
    std::set<IndexedEdge>* m_possibleCollisions;
    std::deque<GodObjectAction*> m_actionQueue;
    bool m_tethered = true;
    float m_tetherFactor = 0.3;

public:
    GodObject(Vector2D position = Vector2D());
    ~GodObject();
    void setMovementDirection(Vector2D movementDirection);
    void update();
    void dumpHashtable();
    void move();
    Vector2D checkCollisions(Vector2D targetPoint);
    void createObstacle(uint16_t id, std::vector<Vector2D> points, bool passable);
    void createRail(uint16_t id, std::vector<Vector2D> points, double displacement);
    void addToObstacle(uint16_t id, std::vector<Vector2D> points);
    void removeObstacle(uint16_t id);
    void enableObstacle(uint16_t id, bool enable = true);
    Vector2D getPosition();
    Vector2D getActiveForce();
    bool getProcessingObstacleCollision();
    bool getDoneColliding();
    bool tethered();
};
