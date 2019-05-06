#include "physics/godObject.hpp"

#include "serial.hpp"
#include "config.hpp"

GodObject::GodObject(Panto* panto, Vector2D position)
: m_position(position)
, m_obstacleMutex{portMUX_FREE_VAL, 0}
{ }

void GodObject::setMovementDirection(Vector2D movementDirection)
{
    m_movementDirection = movementDirection;
}

void GodObject::updateHashtable()
{
    portENTER_CRITICAL(&m_obstacleMutex);
    m_hashtable.processQueues();
    portEXIT_CRITICAL(&m_obstacleMutex);
}

void GodObject::dumpHashtable()
{
    portENTER_CRITICAL(&m_obstacleMutex);
    m_hashtable.print();
    portEXIT_CRITICAL(&m_obstacleMutex);
}

void GodObject::move()
{
    auto lastState = m_processingObstacleCollision;
    m_processingObstacleCollision = false;

    auto nextPosition = m_position + m_movementDirection;
    portENTER_CRITICAL(&m_obstacleMutex);
    auto possibleCollisions =
        m_hashtable.getPossibleCollisions(Edge(m_position, nextPosition));
    portEXIT_CRITICAL(&m_obstacleMutex);
    auto collisions = checkObstacleCollisions(nextPosition, possibleCollisions);
    auto targetPoint = nextPosition;

    while(collisions.size() > 0)
    {
        m_processingObstacleCollision = true;
        targetPoint = 
            collisions[0].m_obstacle->handleCollision(targetPoint, m_position);
        collisions = checkObstacleCollisions(targetPoint, possibleCollisions);
    }

    m_position = targetPoint;

    if(m_processingObstacleCollision)
    {
        auto error = m_position - nextPosition;
        m_activeForce = error * forcePidFactor[0][0] + (error - m_lastError) * forcePidFactor[0][2];
        m_lastError = error;
    }
    
    m_doneColliding = lastState && !m_processingObstacleCollision;
}

std::vector<IndexedEdge> GodObject::checkObstacleCollisions(
    Vector2D point, std::set<IndexedEdge> possibleCollisions)
{
    std::map<Obstacle*, std::vector<uint32_t>> grouped;

    for(auto&& edge : possibleCollisions)
    {
        grouped[edge.m_obstacle].push_back(edge.m_index);
    }

    Edge movement(m_position, point);
    std::vector<IndexedEdge> result;
    uint32_t enteringEdgeIndex;
    for(auto&& obstacle : grouped)
    {
        if(obstacle.first->getEnteringEdge(
            movement, obstacle.second, &enteringEdgeIndex))
        {
            result.emplace_back(obstacle.first, enteringEdgeIndex);
        }
    }

    return result;

    return result;
}

void GodObject::createObstacle(uint16_t id, std::vector<Vector2D> points)
{
    auto temp = Obstacle(points);
    portENTER_CRITICAL(&m_obstacleMutex);
    m_obstacles.emplace(id, std::move(temp));
    portEXIT_CRITICAL(&m_obstacleMutex);
}

void GodObject::addToObstacle(uint16_t id, std::vector<Vector2D> points)
{
    auto it = m_obstacles.find(id);
    if(it != m_obstacles.end())
    {
        portENTER_CRITICAL(&m_obstacleMutex);
        m_obstacles.at(id).add(points);
        portEXIT_CRITICAL(&m_obstacleMutex);
    }
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
        portENTER_CRITICAL(&m_obstacleMutex);
        if(enable != it->second.enabled())
        {
            auto edges = it->second.getAnnotatedEdges();
            if(enable)
            {
                m_hashtable.add(edges);
            }
            else
            {
                m_hashtable.remove(edges);
            }
        }

        it->second.enable(enable);

        portEXIT_CRITICAL(&m_obstacleMutex);
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
