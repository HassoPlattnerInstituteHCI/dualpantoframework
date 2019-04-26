#include "physics/godObject.hpp"

#include "serial.hpp"
#include "config.hpp"

GodObject::GodObject(Panto* panto, Vector2D position)
: m_position(position)
, m_quadtree(panto)
, m_obstacleMutex{portMUX_FREE_VAL, 0}
{ }

void GodObject::setMovementDirection(Vector2D movementDirection)
{
    m_movementDirection = movementDirection;
}

void GodObject::updateQuadtree()
{
    portENTER_CRITICAL(&m_obstacleMutex);
    m_quadtree.processQueues();
    portEXIT_CRITICAL(&m_obstacleMutex);
}

void GodObject::dumpQuadtree()
{
    portENTER_CRITICAL(&m_obstacleMutex);
    m_quadtree.print();
    portEXIT_CRITICAL(&m_obstacleMutex);
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
            collisions[0].m_obstacle->handleCollision(targetPoint, m_position);
        collisions = checkObstacleCollisions(targetPoint);
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

std::vector<IndexedEdge> GodObject::checkObstacleCollisions(Vector2D point)
{
    std::vector<IndexedEdge> result;

    portENTER_CRITICAL(&m_obstacleMutex);
    result = m_quadtree.getCollisions(Edge(m_position, point));
    portEXIT_CRITICAL(&m_obstacleMutex);

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
    DPSerial::sendDebugLog("enableObstacle");
    auto it = m_obstacles.find(id);
    if(it != m_obstacles.end())
    {
        portENTER_CRITICAL(&m_obstacleMutex);
        // if(enable != it->second.enabled())
        // {
        //     DPSerial::sendDebugLog("getAnnotatedEdges+add");
        //     auto edges = it->second.getAnnotatedEdges();
        //     if(enable)
        //     {
        //         DPSerial::sendDebugLog("enable");
        //         for(auto&& edge : edges)
        //         {
        //             m_quadtree.add(
        //                 std::get<0>(edge),
        //                 std::get<1>(edge),
        //                 std::get<2>(edge));
        //         }
        //     }
        //     else
        //     {
        //         DPSerial::sendDebugLog("!enable");
        //         for(auto&& edge : edges)
        //         {
        //             m_quadtree.remove(
        //                 std::get<0>(edge),
        //                 std::get<1>(edge));
        //         }
        //     }
        //     DPSerial::sendDebugLog("getAnnotatedEdges+add done");
        // }
        if(enable != it->second.enabled())
        {
            auto edges = it->second.getAnnotatedEdges();
            if(enable)
            {
                m_quadtree.add(edges);
            }
            else
            {
                m_quadtree.remove(edges);
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
