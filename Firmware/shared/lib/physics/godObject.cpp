#include "physics/godObject.hpp"

#include <algorithm>
#include <utility>
#include <serial.hpp>

const float GodObject::c_bigPantoForceScale = 0.1125;
const float GodObject::c_smallPantoForceScale = 0.125;

GodObject::GodObject(Vector2D position)
: m_position(position)
, m_obstacleMutex{portMUX_FREE_VAL, 0}
{ }

void GodObject::setMovementDirection(Vector2D movementDirection)
{
    m_movementDirection = movementDirection;
}

void GodObject::move()
{
    auto lastState = m_processingObstacleCollision;
    m_processingObstacleCollision = false;

    auto nextPosition = m_position + m_movementDirection;
    auto collisions = checkObstacleCollisions(nextPosition);
    auto targetPoint = nextPosition;

    while(collisions.size() > 0)
    {
        m_processingObstacleCollision = true;
        targetPoint = 
            collisions[0].m_obstacle.handleCollision(targetPoint, m_position);
        collisions = checkObstacleCollisions(targetPoint);
    }

    m_position = targetPoint;

    if(m_processingObstacleCollision)
    {
        m_activeForce = (m_position - nextPosition) * c_smallPantoForceScale;
    }
    
    m_doneColliding = lastState && !m_processingObstacleCollision;
}

std::vector<Collision> GodObject::checkObstacleCollisions(Vector2D point)
{
    std::vector<Collision> result;
    Edge enteringEdge;

    portENTER_CRITICAL(&m_obstacleMutex);
    for(auto obstacle : m_obstacles)
    {
        if(!obstacle.second.enabled())
        {
            continue;
        }

        auto colliding =
            obstacle.second.getEnteringEdge(point, m_position, &enteringEdge);
        if(colliding)
        {
            result.emplace_back(obstacle.second, enteringEdge);
        }
    }
    portEXIT_CRITICAL(&m_obstacleMutex);

    return result;
}

void GodObject::addObstacle(uint16_t id, std::vector<Vector2D> points)
{
    auto temp = Obstacle(points);
    portENTER_CRITICAL(&m_obstacleMutex);
    m_obstacles.emplace(id, std::move(temp));
    portEXIT_CRITICAL(&m_obstacleMutex);
}

void GodObject::removeObstacle(uint16_t id)
{
    portENTER_CRITICAL(&m_obstacleMutex);
    m_obstacles.erase(id);
    portEXIT_CRITICAL(&m_obstacleMutex);
}

void GodObject::enableObstacle(uint16_t id, bool enable)
{
    auto it = m_obstacles.find(id);
    if(it != m_obstacles.end())
    {
        m_obstacles.at(id).enable(enable);
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
