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

/*
The speed control is in detail described in our Dropbox (Interaction Techniques Haptic in Unity): 
https://www.dropbox.com/scl/fi/uljoe140fet2b53bjhr4y/DualPanto-Speed-Control.pptx?dl=0&rlkey=6k77wrfnb3oaxg186489tpinj
*/

enum TetherState {Inner, Active, Outer}; 
/* the handle can be in 3 states:
    1. Inner: the acceleration of the god object is proportional to the distance between god object and handle
    2. Active: the distance between the handle and the god object is in between the inner and the outer tether radius. The god object movement is now at max speed.
    3. Outer: out of outer tether radius. Multiple strategies to treat this scenario are described below.
*/

enum OutOfTetherStrategy {Penalize, Pause, Leash};
/* possible strategies when the handle is pushed out of the outer tether radius. 
    Penalize: the player e.g. loses health points when moving out of the tether (in FPS). Unity needs to take care of auditory cues to inform the user when out of the tether radius. For the firmware this doesn't matter.
    Pause: the god object position doesn't update anymore (speed control is disabled) but the handle can still collide with obstacles.
    Leash: the handle is "on leash" and can collide with obstacles. The god object is moving at max speed to the position of the handle (along the direct vector between both points). A weak constant pulling force indicates where the god object is.
*/

class GodObject
{
private:
    static constexpr double c_resolveDistance = 0.00001;
    static constexpr double c_tetherForcePullingBack = -0.2;
    
    Vector2D m_position;
    Vector2D m_tetherPosition;
    Vector2D m_movementDirection;
    Vector2D m_activeForce;
    std::map<uint16_t, Obstacle*> m_obstacles;
    Hashtable m_hashtable;
    portMUX_TYPE m_obstacleMutex;
    bool m_processingObstacleCollision;
    u_short m_numCollisions = 0; // for speed control; when the speed is controlled and a collision with multiple walls occurs (in a corner) then the 2nd collision must also be feelable
    bool m_doneColliding;
    Vector2D m_lastError;
    std::set<IndexedEdge>* m_possibleCollisions;
    std::deque<GodObjectAction*> m_actionQueue;
    
    // tether related properties
    bool m_tethered = true;
    double m_tetherFactor = 0.01;
    Vector2D m_lastErrorTether;
    double m_tetherInnerRadius = 1;
    double m_tetherOuterRadius = 2;
    TetherState m_tetherState = Inner;
    double m_tetherSafeZonePadding = 0; // padding on the inner border to avoid that the tether gets pushed into the free moving zone immediately once the inner radius is passed
    OutOfTetherStrategy m_tetherStrategy = Penalize;
    bool m_tetherPockEnabled = true;

public:
    GodObject(Vector2D position = Vector2D());
    ~GodObject();
    void setMovementDirection(Vector2D movementDirection);
    void update();
    void dumpHashtable();
    bool move(bool isTweening);
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
    void setSpeedControl(bool active, double tetherFactor, double innerTetherRadius, double outerTetherRadius, OutOfTetherStrategy strategy);
};
