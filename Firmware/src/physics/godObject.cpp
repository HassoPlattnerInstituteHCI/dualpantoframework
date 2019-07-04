#include "physics/godObject.hpp"

#include "config/config.hpp"
#include "utils/serial.hpp"

GodObject::GodObject(Vector2D position)
: m_position(position)
, m_obstacleMutex{portMUX_FREE_VAL, 0}
, m_possibleCollisions(new std::set<IndexedEdge>())
{ }

GodObject::~GodObject()
{
    delete m_possibleCollisions;
}

void GodObject::setMovementDirection(Vector2D movementDirection)
{
    m_movementDirection = movementDirection;
}

void GodObject::update()
{
    if(m_actionQueue.empty())
    {
        return;
    }

    portENTER_CRITICAL(&m_obstacleMutex);
    for(auto i = 0; i < obstacleChangesPerFrame && !m_actionQueue.empty(); ++i)
    {
        const auto action = m_actionQueue.front();
        m_actionQueue.pop_front();
        switch (action.m_type)
        {
        case ENABLE_EDGE:
            DPSerial::sendInstantDebugLog(
                "%10p %10u %+010.3f %+010.3f %+010.3f %+010.3f",
                action.m_type,
                std::get<0>(action.m_data.m_annotatedEdge),
                std::get<1>(action.m_data.m_annotatedEdge),
                std::get<2>(action.m_data.m_annotatedEdge).m_first.x,
                std::get<2>(action.m_data.m_annotatedEdge).m_first.y,
                std::get<2>(action.m_data.m_annotatedEdge).m_second.x,
                std::get<2>(action.m_data.m_annotatedEdge).m_second.y);
            m_hashtable.add(
                std::get<0>(action.m_data.m_annotatedEdge),
                std::get<1>(action.m_data.m_annotatedEdge),
                std::get<2>(action.m_data.m_annotatedEdge));
            break;
        case DISABLE_EDGE:
            m_hashtable.remove(
                std::get<0>(action.m_data.m_annotatedEdge),
                std::get<1>(action.m_data.m_annotatedEdge),
                std::get<2>(action.m_data.m_annotatedEdge));
            break;
        case REMOVE_OBSTACLE:
            m_obstacles.erase(action.m_data.m_obstacleId);
            break;
        default:
            break;
        }
    }
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
    m_position = checkCollisions(nextPosition);
    portEXIT_CRITICAL(&m_obstacleMutex);

    if(m_processingObstacleCollision)
    {
        auto error = m_position - nextPosition;
        m_activeForce = error * forcePidFactor[0][0] + (error - m_lastError) * forcePidFactor[0][2];
        m_lastError = error;
    }
    
    m_doneColliding = lastState && !m_processingObstacleCollision;
}

Vector2D GodObject::checkCollisions(Vector2D targetPoint)
{
    m_possibleCollisions->clear();
    m_hashtable.getPossibleCollisions(
        Edge(m_position, targetPoint), m_possibleCollisions);
    if(m_possibleCollisions->empty())
    {
        return targetPoint;
    }

    bool foundCollision;

    do
    {
        // result vars
        foundCollision = false;
        double shortestMovementRatio = 0;
        Vector2D closestEdgeFirst;
        Vector2D closestEdgeFirstMinusSecond;

        // value is constant for loop
        const auto posMinusTarget = m_position - targetPoint;
        
        for(auto&& indexedEdge : *m_possibleCollisions)
        {
            auto edge = indexedEdge.m_obstacle->getEdge(indexedEdge.m_index);
            auto edgeFirst = edge.m_first;
            auto firstMinusPos = edgeFirst - m_position;
            auto firstMinusSecond = edgeFirst - edge.m_second;
            auto divisor = determinant(firstMinusSecond, posMinusTarget);

            auto movementRatio =
                -determinant(firstMinusSecond, firstMinusPos) / divisor;
            if(movementRatio < 0 || movementRatio > 1)
            {
                continue;
            }

            auto edgeRatio =
                determinant(firstMinusPos, posMinusTarget) / divisor;
            if(edgeRatio < 0 || edgeRatio > 1)
            {
                continue;
            }

            if(!foundCollision || movementRatio < shortestMovementRatio)
            {
                foundCollision = true;
                shortestMovementRatio = movementRatio;
                closestEdgeFirst = edgeFirst;
                closestEdgeFirstMinusSecond = firstMinusSecond;
            }
        }
        
        if(foundCollision)
        {
            m_processingObstacleCollision = true;

            auto perpendicular = Vector2D(
                -closestEdgeFirstMinusSecond.y,
                closestEdgeFirstMinusSecond.x);
            auto resolveRatio =
                -determinant(
                    closestEdgeFirstMinusSecond,
                    closestEdgeFirst - targetPoint)
                / determinant(
                    closestEdgeFirstMinusSecond,
                    perpendicular);
            auto resolveVec = perpendicular * resolveRatio;
            auto resolveLength = resolveVec.length();
            targetPoint = targetPoint - (resolveVec * ((resolveLength + c_resolveDistance) / resolveLength));

            // update possible collisions
            m_possibleCollisions->clear();
            m_hashtable.getPossibleCollisions(
                Edge(m_position, targetPoint), m_possibleCollisions);
        }
    } while (foundCollision);

    return targetPoint;
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
    enableObstacle(id, false);
    m_actionQueue.emplace_back(REMOVE_OBSTACLE, id);
}

void GodObject::enableObstacle(uint16_t id, bool enable)
{
    auto it = m_obstacles.find(id);
    if(it != m_obstacles.end())
    {
        portENTER_CRITICAL(&m_obstacleMutex);
        if(enable != it->second.enabled())
        {
            const auto edges = it->second.getAnnotatedEdges();
            const auto action = enable ? ENABLE_EDGE : DISABLE_EDGE;
            for (const auto& edge : edges)
            {
                m_actionQueue.emplace_back(action, edge);
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
