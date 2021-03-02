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
    1. Inner: the handle can freely move within a close radius around the god object without triggering speed control (otherwise there would always be force rendered, even if the player was just standing around).
    2. Active: the god object is under speed control. Its acceleration is proportional to the distance between god object and handle.
    3. Outer: out of outer tether radius. Multiple strategies to treat this scenario are described below.
*/

enum OutOfTetherStrategy {MaxSpeed, Exploration, Leash};
/* possible strategies when the handle is pushed out of the outer tether radius. 
    MaxSpeed: the god object continues to move at max speed and the handle gets pushed back to the new god object position player. On the Unity side there could be an additional penalization (with auditory cues), e.g. that the player loses health points when moving out of the tether (in FPS).
    Exploration: the god object position doesn't update anymore and the game is paused (speed control is disabled). The handle can still collide with obstacles and is in exploration mode.
    Leash: the handle is "on leash" and can collide with obstacles. The god object is moving at max speed to the position of the handle (along the direct vector between both points). A weak constant pulling force indicates where the god object is.
*/

class GodObject
{
private:
    static constexpr double c_resolveDistance = 0.00001;
    static constexpr double c_tetherForcePullingBack = -0.5;
    static constexpr double c_tetherPockDistance = 500; // when tethered and collision with wall happens push the handle this far into the wall (along the direction of movement)
    static constexpr double c_railsTetherFactor = 0.75; // if speed control is enabled and the god object collides with a wall: move the god object by this factor along the vector between handle and god object. This enables jumping rails under speed control.

    Vector2D m_position;
    Vector2D m_tetherPosition;
    Vector2D m_movementDirection;
    Vector2D m_activeForce;
    std::map<uint16_t, Obstacle*> m_obstacles;
    Hashtable *m_hashtable = nullptr;
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
    double m_tetherOuterRadius = 3;
    TetherState m_tetherState = Inner;
    double m_tetherSafeZonePadding = 0; // padding on the inner border to avoid that the tether gets pushed into the free moving zone immediately once the inner radius is passed
    OutOfTetherStrategy m_tetherStrategy = Leash;
    bool m_tetherPockEnabled = true;

    Hashtable& hashtable();

public:
    GodObject(Vector2D position = Vector2D());
    ~GodObject();
    void setMovementDirection(Vector2D movementDirection);
    void update();
    void dumpHashtable();
    bool move(bool isTweening, bool isFrozen);
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
    void setSpeedControl(bool active, double tetherFactor, double innerTetherRadius, double outerTetherRadius, OutOfTetherStrategy strategy, bool pockEnabled); 
};
