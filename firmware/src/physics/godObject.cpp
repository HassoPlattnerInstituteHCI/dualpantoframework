#include "physics/godObject.hpp"

#include "config/config.hpp"
#include "utils/serial.hpp"

GodObject::GodObject(Vector2D position)
    : m_position(position), m_obstacleMutex{portMUX_FREE_VAL, 0}, m_possibleCollisions(new std::set<IndexedEdge>())
{
}

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
    if (m_actionQueue.empty())
    {
        return;
    }

    portENTER_CRITICAL(&m_obstacleMutex);
    for (auto i = 0; i < obstacleChangesPerFrame && !m_actionQueue.empty(); ++i)
    {
        auto action = m_actionQueue.front();
        m_actionQueue.pop_front();
        switch (action->m_type)
        {
        case HT_ENABLE_EDGE:
        {
            m_hashtable.add(action->m_data.m_annotatedEdge);
            break;
        }
        case HT_DISABLE_EDGE:
        {
            m_hashtable.remove(action->m_data.m_annotatedEdge);
            break;
        }
        case GO_REMOVE_OBSTACLE:
        {
            m_obstacles.erase(action->m_data.m_obstacleId);
            break;
        }
        default:
        {
            break;
        }
        }
        delete action;
    }
    portEXIT_CRITICAL(&m_obstacleMutex);
}

void GodObject::dumpHashtable()
{
    portENTER_CRITICAL(&m_obstacleMutex);
    m_hashtable.print();
    portEXIT_CRITICAL(&m_obstacleMutex);
}

bool GodObject::move()
{
    auto lastState = m_processingObstacleCollision;
    m_processingObstacleCollision = false;

    Vector2D nextPosition;
    Vector2D handlePosition = m_position + m_movementDirection;
    float movementStepLength = m_movementDirection.length(); // only used for tethering
    float tetherInnerRadiusActive = m_tetherInnerRadius - m_tetherSafeZonePadding;
    if (m_tethered) {
        
        // is the handle in the "free movement zone" or is the tether active?
        if ((!m_tetherActive && (m_movementDirection.length() < m_tetherInnerRadius)) ||
        (m_tetherActive && (m_movementDirection.length() < tetherInnerRadiusActive)))
        {
            // if the handle is moved within the inner radius of the tether the god object won't follow
            m_tetherActive = false;
            return false;
        } else {
            m_tetherActive = true;
        }
        movementStepLength = min(m_tetherOuterRadius, m_movementDirection.length());
        
        // check if the handle is beyond the max radius of the tether
        nextPosition = m_position + (m_movementDirection.normalize() * movementStepLength * m_tetherFactor);
    } else {
        nextPosition = m_position + m_movementDirection;
    }
    
    portENTER_CRITICAL(&m_obstacleMutex);
    m_position = checkCollisions(nextPosition);
    portEXIT_CRITICAL(&m_obstacleMutex);
    
    m_doneColliding = lastState && !m_processingObstacleCollision;

    if (m_processingObstacleCollision)
    {
        // the PID error is the difference between the godobject and the handle position
        auto error = m_position - handlePosition;
        m_activeForce = error * forcePidFactor[0][0] + (error - m_lastError) * forcePidFactor[0][2];
        m_lastError = error;
        m_tetherActive = false;
    
    } else {
        if (m_tethered && m_tetherActive && !m_doneColliding) { // && (m_movementDirection.length() > tetherThreshold)
            // if the players max movement speed is limited (tethered) then the error is the difference between the actual handle position and the calculated position
            auto error = m_movementDirection.normalize() * (tetherInnerRadiusActive - m_movementDirection.length());
            m_activeForce = error * forcePidFactor[0][0] + (error - m_lastErrorTether) * forcePidFactor[0][2];
            m_lastErrorTether = error;
        }
    }
    return true;
}

Vector2D GodObject::checkCollisions(Vector2D targetPoint)
{
    if (m_position == targetPoint)
    {
        return targetPoint;
    }
    m_possibleCollisions->clear();
    m_hashtable.getPossibleCollisions(
        Edge(m_position, targetPoint), m_possibleCollisions);
    if (m_possibleCollisions->empty())
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

        if (posMinusTarget == Vector2D(0, 0))
        {
            return targetPoint;
        }

        for (auto&& indexedEdge : *m_possibleCollisions)
        {
            auto edge = indexedEdge.m_obstacle->getEdge(indexedEdge.m_index);
            auto edgeFirst = edge.m_first;
            auto firstMinusPos = edgeFirst - m_position;
            auto firstMinusSecond = edgeFirst - edge.m_second;
            auto divisor =
                Vector2D::determinant(firstMinusSecond, posMinusTarget);

            auto movementRatio =
                -Vector2D::determinant(firstMinusSecond, firstMinusPos) /
                divisor;
            if (movementRatio < 0 || movementRatio > 1)
            {
                continue;
            }

            auto edgeRatio =
                Vector2D::determinant(firstMinusPos, posMinusTarget) / divisor;
            if (edgeRatio < 0 || edgeRatio > 1)
            {
                continue;
            }

            if (!foundCollision || movementRatio < shortestMovementRatio)
            {
                //if a collision with a passable object is detected (e.g. a haptic rail) and the handle is not within the rail object,
                //discard the collision and continue
                auto ob = indexedEdge.m_obstacle;
                if (ob->passable && !ob->contains(targetPoint))
                {
                    continue;
                }
                foundCollision = true;
                shortestMovementRatio = movementRatio;
                closestEdgeFirst = edgeFirst;
                closestEdgeFirstMinusSecond = firstMinusSecond;
            }
        }

        if (foundCollision)
        {
            m_processingObstacleCollision = true;

            auto perpendicular = Vector2D(
                -closestEdgeFirstMinusSecond.y,
                closestEdgeFirstMinusSecond.x);
            auto resolveRatio =
                -Vector2D::determinant(
                    closestEdgeFirstMinusSecond,
                    closestEdgeFirst - targetPoint) /
                Vector2D::determinant(
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

void GodObject::createObstacle(uint16_t id, std::vector<Vector2D> points, bool passable)
{
    // create obstacle or passable obstacle
    auto ob = new Obstacle(points, passable);
    portENTER_CRITICAL(&m_obstacleMutex);
    m_obstacles.emplace(id, ob);
    portEXIT_CRITICAL(&m_obstacleMutex);
}

void GodObject::createRail(uint16_t id, std::vector<Vector2D> points, double displacement)
{
    portENTER_CRITICAL(&m_obstacleMutex);
    Rail* rail = new Rail(points, displacement);
    m_obstacles.emplace(id, rail);
    portEXIT_CRITICAL(&m_obstacleMutex);
    return;
    
}

void GodObject::addToObstacle(uint16_t id, std::vector<Vector2D> points)
{
    auto it = m_obstacles.find(id);
    if (it != m_obstacles.end())
    {
        portENTER_CRITICAL(&m_obstacleMutex);
        m_obstacles.at(id)->add(points);
        portEXIT_CRITICAL(&m_obstacleMutex);
    }
}

void GodObject::removeObstacle(uint16_t id)
{
    enableObstacle(id, false);
    m_actionQueue.push_back(new GodObjectAction(GO_REMOVE_OBSTACLE, id));
}

void GodObject::enableObstacle(uint16_t id, bool enable)
{
    auto it = m_obstacles.find(id);
    if (it != m_obstacles.end())
    {
        portENTER_CRITICAL(&m_obstacleMutex);
        if (enable != it->second->enabled())
        {
            const auto edges = it->second->getIndexedEdges();
            const auto action = enable ? HT_ENABLE_EDGE : HT_DISABLE_EDGE;
            for (const auto& edge : edges)
            {
                m_actionQueue.push_back(new GodObjectAction(
                    action,
                    new AnnotatedEdge(
                        new IndexedEdge(edge.m_obstacle, edge.m_index),
                        new Edge(edge.getEdge()))));
            }
        }
        it->second->enable(enable);
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

bool GodObject::tethered()
{
    return m_tethered;
}