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

enum TetherState {Inner, Active, Outer}; 
/* the handle can be in 3 states:
    1. in the "free movement zone" (given by the inner tether radius): here no force holds the handle back
    2. in the active force field (between the inner and the outer tether radius): here the applied user force pushes the handle back towards the new go position
    3. out of the tether field (Outer): here the handle can freely move again and the applied collision force is calculated from collisions between the handle position and objects; 
    the godobject just moves towards the position of the handle at max tether speed
*/

class GodObject
{
private:
    static constexpr double c_resolveDistance = 0.00001;
    Vector2D m_position;
    Vector2D m_tetherPosition;
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
    
    // tether related properties
    bool m_tethered = true;
    float m_tetherFactor = 0.001;
    Vector2D m_lastErrorTether;
    double m_tetherInnerRadius = 0;
    double m_tetherOuterRadius = 2;
    TetherState m_tetherState = Inner;
    double m_tetherSafeZonePadding = 0; // padding on the inner border to avoid that the tether gets pushed into the free moving zone immediately once the inner radius is passed

    

public:
    GodObject(Vector2D position = Vector2D());
    ~GodObject();
    void setMovementDirection(Vector2D movementDirection);
    void update();
    void dumpHashtable();
    bool move();
    Vector2D checkCollisions(Vector2D targetPoint, Vector2D currentPosition);
    void createObstacle(uint16_t id, std::vector<Vector2D> points, bool passable);
    void createRail(uint16_t id, std::vector<Vector2D> points, double displacement);
    void addToObstacle(uint16_t id, std::vector<Vector2D> points);
    void removeObstacle(uint16_t id);
    void enableObstacle(uint16_t id, bool enable = true);
    Vector2D getPosition();
    Vector2D getActiveForce();
    Vector2D getCollisionForce(Vector2D godObjectPosition, Vector2D handlePosition);
    Vector2D getTetherForce(Vector2D error);
    void renderForce(Vector2D collisionForce, Vector2D tetherForce);
    bool processTetheringForce(Vector2D handlePosition, bool lastCollisionState);
    bool getProcessingObstacleCollision();
    bool getDoneColliding();
    bool tethered();
};
