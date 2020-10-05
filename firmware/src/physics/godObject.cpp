#include "physics/godObject.hpp"

#include "config/config.hpp"
#include "utils/serial.hpp"

GodObject::GodObject(Vector2D position)
    : m_position(position), m_tetherPosition(position), m_obstacleMutex{portMUX_FREE_VAL, 0}, m_possibleCollisions(new std::set<IndexedEdge>())
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
    // returns if force is applied or not
    auto lastState = m_processingObstacleCollision;
    m_processingObstacleCollision = false;

    Vector2D nextGoPosition;
    Vector2D handlePosition = m_position + m_movementDirection;
    float movementStepLength = m_movementDirection.length(); // only used for tethering
    float tetherInnerRadiusActive = m_tetherInnerRadius - m_tetherSafeZonePadding;
    if (m_tethered) {
        double distHandleToGo = m_movementDirection.length();
        // find out the current tether state
        if ((m_tetherState==Inner && (distHandleToGo < m_tetherInnerRadius)) ||
        (m_tetherState!=Inner && (distHandleToGo < tetherInnerRadiusActive)))
        {
            // if the handle is moved within the inner radius of the tether the god object won't follow
            m_tetherState = Inner;
            return false;
        } else {
            // if the tetherState was previously active and we saw a collision then we can't now switch into the outer state
            m_tetherState = ((distHandleToGo > m_tetherOuterRadius) && !(lastState && m_tetherState == Active)) ? Outer : Active;
        }
        movementStepLength = min(m_tetherOuterRadius, distHandleToGo);
        
        // this is the movement of the god object that follows the tether
        nextGoPosition = m_position + (m_movementDirection.normalize() * movementStepLength * m_tetherFactor);
    } else {
        nextGoPosition = m_position + m_movementDirection;
    }
    
    // no matter what the tether state is we need to check if the god object is colliding with an obstacle
    Vector2D godObjectPos;
    portENTER_CRITICAL(&m_obstacleMutex);
    godObjectPos = checkCollisions(nextGoPosition, m_position);
    if (m_processingObstacleCollision && m_tetherState == Active) {
        // extra collision check to make sure we can jump passable obstacles and guides
        m_position = checkCollisions(handlePosition, m_position);
    } else {
        m_position = godObjectPos;
    }
    if (m_tetherState == Outer) {
        m_tetherPosition = checkCollisions(handlePosition, m_tetherPosition);
    }
    portEXIT_CRITICAL(&m_obstacleMutex);
    
    m_doneColliding = lastState && !m_processingObstacleCollision;

    if (!m_tethered) {
        if (m_processingObstacleCollision)
        {
            renderForce(getCollisionForce(m_position, handlePosition), Vector2D(0,0));
        }
        return m_processingObstacleCollision;
    } else {
        return processTetheringForce(handlePosition, lastState);
    }
}

Vector2D GodObject::getCollisionForce(Vector2D godObjectPosition, Vector2D handlePosition){
    // the PID error is the difference between the virtual object and the handle position
    // the virtual object can either be a) the godobject or b) the tether
    auto error = godObjectPosition - handlePosition;
    auto force = error * forcePidFactor[0][0] + (error - m_lastError) * forcePidFactor[0][2];
    m_lastError = error;
    return force;
}

Vector2D GodObject::getTetherForce(Vector2D error){
    auto force = error * forcePidFactor[0][0] + (error - m_lastErrorTether) * forcePidFactor[0][2];
    m_lastErrorTether = error;
    return force;
}

void GodObject::renderForce(Vector2D collisionForce, Vector2D tetherForce) {
    m_activeForce = collisionForce + tetherForce;
}

bool GodObject::processTetheringForce(Vector2D handlePosition, bool lastCollisionState){
    // returns if force is active or handle is freely moving
    if (m_tetherState == Active) {
        float tetherInnerRadiusActive = m_tetherInnerRadius - m_tetherSafeZonePadding;
        auto error = m_movementDirection.normalize() * (tetherInnerRadiusActive - m_movementDirection.length());
        auto tetherForce = getTetherForce(error);
        if (m_processingObstacleCollision) {
            // god object collision
            /*if (!lastCollisionState) {
                // weak constant force pushing the handle into the the wall so that the user gets force feedback at their fingertip
                auto error = m_movementDirection.normalize() * 10;
                renderTetherForce(error);
            } else {
                renderCollisionForce(m_position, handlePosition);
            }*/
            renderForce(getCollisionForce(m_position, handlePosition), tetherForce);
            return true;
        } else {
            if (!m_doneColliding) {
                // regular tether force active that pushes the handle back to the inner tether radius
                
                renderForce(Vector2D(0,0), tetherForce);
            }
            return !m_doneColliding;
        }
    } else if (m_tetherState==Outer) {
        auto error = m_movementDirection.normalize() * -1;
        auto tetherForce = getTetherForce(error);
        if (m_processingObstacleCollision) {
            /*
            if (!lastCollisionState) {
                // weak constant force pushing the handle into the the wall so that the user gets force feedback at their fingertip
                auto error = m_movementDirection.normalize() * 10;
                renderTetherForce(error);
            } else {
                renderCollisionForce(m_tetherPosition, handlePosition);
            }*/
            renderForce(getCollisionForce(m_tetherPosition, handlePosition), tetherForce);
        } else {
            // weak constant force pulling the tether back to the outer tether radius
            renderForce(Vector2D(0,0), tetherForce);
        }
        return true;
    }
    return false;
}

Vector2D GodObject::checkCollisions(Vector2D targetPoint, Vector2D currentPosition)
{
    /*
    Collision detection works in 3 stages:
    1. Select collision candidates using a 2D lookup table. Every cell in that table contains the edges that go through it. That's why only particular edges have to be checked for collisions.
    2. The actual collision detection.
    3. If a collision is detected calculate the new god object position.

    If a collision is detected the collision detection is repeated with the new target position. This way we can check if the new position is accessible at all or not. 

    Added by Julius on 30.09.20
    For more information check Lukas Wagners MT (section 4.3.1): https://www.dropbox.com/home/2018%20CHI%20Dueling%20Pantographs/Layer%202%20Firmware%20(Lukas%20Wagner)?preview=2019_09_07+ESP+Firmware+for+God+Haptic+Objects+%3D+Masterarbeit+(Lukas+Wagner).pdf
    */

    if (currentPosition == targetPoint)
    {
        return targetPoint;
    }
    // 1. select collision candidates
    m_possibleCollisions->clear();
    m_hashtable.getPossibleCollisions(
        Edge(currentPosition, targetPoint), m_possibleCollisions);
    if (m_possibleCollisions->empty())
    {
        return targetPoint;
    }

    bool foundCollision;

    // 2. check if collisions are present between 2 vectors
    // first vector goes from god object to handle and the
    // second vector is the potential collision edge
    do
    {
        // result vars
        foundCollision = false;
        double shortestMovementRatio = 0;
        Vector2D closestEdgeFirst;
        Vector2D closestEdgeFirstMinusSecond;

        // direction of movement: value is constant for loop
        const auto posMinusTarget = currentPosition - targetPoint;

        if (posMinusTarget == Vector2D(0, 0))
        {
            return targetPoint;
        }

        for (auto&& indexedEdge : *m_possibleCollisions)
        {
            auto edge = indexedEdge.m_obstacle->getEdge(indexedEdge.m_index);
            auto edgeFirst = edge.m_first;
            auto firstMinusPos = edgeFirst - currentPosition;
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

            // we have a collision!
            if (!foundCollision || movementRatio < shortestMovementRatio) // I think the second condition never gets called because the movementRatio loop 
            // would already continue if the movementRatio was below 0 (which is the shortestMovementRatio)
            {
                // if a collision with a passable object is detected (e.g. a haptic rail) and the handle is not within the bounds of the colliding object,
                // discard the collision and continue
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

        // calculate new god object position
        if (foundCollision)
        {
            m_processingObstacleCollision = true;
            
            // god object slides along the colliding edge according to the handle movement but with tethered speed

            if (m_tethered) {
                // if the movement is tethered the targetPoint can not be further away from the current position than the outer tether radius
                const Vector2D movementVector = targetPoint - currentPosition;
                double movementLength = min(m_tetherOuterRadius, movementVector.length());
                targetPoint = currentPosition + (movementVector.normalize() * movementLength);
            }

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
            // c_resolveDistance is super small --> we need to add a tiny padding between the godobject and the edge so that it's not getting stuck in the edge
            targetPoint = targetPoint - (resolveVec * ((resolveLength + c_resolveDistance) / resolveLength));

            
            // check for the new point if there is another collision with any other edge
            m_possibleCollisions->clear();
            m_hashtable.getPossibleCollisions(
                Edge(currentPosition, targetPoint), m_possibleCollisions);
        }
        // there can be multiple collisions, that's why we have to loop as well over the other possible collisions
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