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

// void print(const GodObjectAction* const action)
// {
//     DPSerial::sendInstantDebugLog(
//                 "ae %p",
//                 action);
//     DPSerial::sendInstantDebugLog(
//         "ie %p",
//         action
//             ->m_data
//             .m_annotatedEdge
//             ->m_indexedEdge);
//     DPSerial::sendInstantDebugLog(
//         "ob %p",
//         action
//             ->m_data
//             .m_annotatedEdge
//             ->m_indexedEdge
//             ->m_obstacle);
//     DPSerial::sendInstantDebugLog(
//         "in %u",
//         action
//             ->m_data
//             .m_annotatedEdge
//             ->m_indexedEdge
//             ->m_index);
// }

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
        // DPSerial::sendInstantDebugLog("ty %u", action->m_type);
        switch (action->m_type)
        {
        case HT_ENABLE_EDGE:
        {
            // print(action);
            // DPSerial::sendInstantDebugLog(
            //     "ae %10p ie %10p",
            //     &(action.m_data.m_annotatedEdge),
            //     action.m_data.m_annotatedEdge.m_indexedEdge);
            // DPSerial::sendInstantDebugLog(
            //     "ob %10p in %10u",
            //     action.m_data.m_annotatedEdge.m_indexedEdge->m_obstacle,
            //     action.m_data.m_annotatedEdge.m_indexedEdge->m_index);
            // DPSerial::sendInstantDebugLog(
            //     "fx %+010.3f fy %+010.3f sx %+010.3f sy %+010.3f",
            //     action.m_data.m_annotatedEdge.m_edge->m_first.x,
            //     action.m_data.m_annotatedEdge.m_edge->m_first.y,
            //     action.m_data.m_annotatedEdge.m_edge->m_second.x,
            //     action.m_data.m_annotatedEdge.m_edge->m_second.y);
            m_hashtable.add(action->m_data.m_annotatedEdge);
            break;
        }
        case HT_DISABLE_EDGE:
        {
            // print(action);
            m_hashtable.remove(action->m_data.m_annotatedEdge);
            break;
        }
        case GO_REMOVE_OBSTACLE:
        {
            // DPSerial::sendInstantDebugLog(
            //     "id %5u",
            //     action->m_data.m_obstacleId);
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

void GodObject::move()
{
    auto lastState = m_processingObstacleCollision;
    m_processingObstacleCollision = false;

    auto nextPosition = m_position + m_movementDirection;
    portENTER_CRITICAL(&m_obstacleMutex);
    m_position = checkCollisions(nextPosition);
    portEXIT_CRITICAL(&m_obstacleMutex);

    if (m_processingObstacleCollision)
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

        for (auto &&indexedEdge : *m_possibleCollisions)
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
    if (it != m_obstacles.end())
    {
        portENTER_CRITICAL(&m_obstacleMutex);
        m_obstacles.at(id).add(points);
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
        if (enable != it->second.enabled())
        {
            const auto edges = it->second.getIndexedEdges();
            const auto action = enable ? HT_ENABLE_EDGE : HT_DISABLE_EDGE;
            for (const auto &edge : edges)
            {
                // DPSerial::sendInstantDebugLog(
                //     "-> ie %p ob %p in %u",
                //     &edge,
                //     edge.m_obstacle,
                //     edge.m_index);
                // DPSerial::sendInstantDebugLog(
                //     "ie %p",
                //     ae.m_indexedEdge);
                // DPSerial::sendInstantDebugLog(
                //     "ob %p",
                //     ae.m_indexedEdge->m_obstacle);
                // DPSerial::sendInstantDebugLog(
                //     "in %u",
                //     ae.m_indexedEdge->m_index);
                m_actionQueue.push_back(new GodObjectAction(
                    action,
                    new AnnotatedEdge(
                        new IndexedEdge(edge.m_obstacle, edge.m_index),
                        new Edge(edge.getEdge()))));
                // DPSerial::sendInstantDebugLog(
                //     "ae %p",
                //     m_actionQueue.back());
                // DPSerial::sendInstantDebugLog(
                //     "ie %p",
                //     m_actionQueue.back()
                //         ->m_data
                //         .m_annotatedEdge
                //         ->m_indexedEdge);
                // DPSerial::sendInstantDebugLog(
                //     "ob %p",
                //     m_actionQueue.back()
                //         ->m_data
                //         .m_annotatedEdge
                //         ->m_indexedEdge
                //         ->m_obstacle);
                // DPSerial::sendInstantDebugLog(
                //     "in %u",
                //     m_actionQueue.back()
                //         ->m_data
                //         .m_annotatedEdge
                //         ->m_indexedEdge
                //         ->m_index);
                // const auto& back = m_actionQueue.back();
                // print(back);
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
