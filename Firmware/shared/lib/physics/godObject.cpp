#include "physics/godObject.hpp"

#include <algorithm>
#include <serial.hpp>

const float GodObject::c_bigPantoForceScale = 0.1125;
const float GodObject::c_smallPantoForceScale = 0.125;

GodObject::GodObject(Vector2D position) : m_position(position) { }

void GodObject::setMovementDirection(Vector2D movementDirection)
{
    m_movementDirection = movementDirection;
}

void GodObject::move()
{
    DPSerial::sendDebugLog("go_move_1");
    auto lastState = m_processingObstacleCollision;
    m_processingObstacleCollision = false;

    DPSerial::sendDebugLog("go_move_2");
    auto nextPosition = m_position + m_movementDirection;
    auto collisions = checkObstacleCollisions(nextPosition);
    auto targetPoint = nextPosition;

    DPSerial::sendDebugLog("go_move_3");
    while(collisions.size() > 0)
    {
        DPSerial::sendDebugLog("am in loop");
        m_processingObstacleCollision = true;
        targetPoint = 
            collisions[0].m_obstacle.handleCollision(targetPoint, m_position);
        collisions = checkObstacleCollisions(targetPoint);
    }

    DPSerial::sendDebugLog("go_move_4");
    m_position = targetPoint;

    DPSerial::sendDebugLog("go_move_5");
    if(m_processingObstacleCollision)
    {
        m_activeForce = (m_position - nextPosition) * c_smallPantoForceScale;
    }
    
    DPSerial::sendDebugLog("go_move_6");
    m_doneColliding = lastState && !m_processingObstacleCollision;
}

std::vector<Collision> GodObject::checkObstacleCollisions(Vector2D point)
{
    std::vector<Collision> result;
    Edge enteringEdge;

    for(auto obstacle : m_obstacles)
    {
        auto colliding =
            obstacle.getEnteringEdge(point, m_position, &enteringEdge);
        if(colliding)
        {
            result.emplace_back(obstacle, enteringEdge);
        }
    }

    return result;
}

void GodObject::addObstacle(Obstacle obstacle)
{
    m_obstacles.push_back(obstacle);
}

void GodObject::removeObstacle(Obstacle obstacle)
{
    auto it = std::find(m_obstacles.begin(), m_obstacles.end(), obstacle);
    if(it != m_obstacles.end())
    {
        m_obstacles.erase(it);
    }
}

Vector2D GodObject::getPosition()
{
    return m_position;
}

Vector2D GodObject::getActiveForce()
{
    return m_activeForce;
}

bool GodObject::getProcessingObstacleCollision()
{
    return m_processingObstacleCollision;
}

bool GodObject::getDoneColliding()
{
    return m_doneColliding;
}