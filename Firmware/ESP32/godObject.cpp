#include "godObject.hpp"

GodObject::GodObject(Vector2D position) : m_position(position) { }

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