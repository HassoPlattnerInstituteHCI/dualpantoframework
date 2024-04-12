#include "physics/godObject.hpp"

#include "config/config.hpp"
#include "utils/serial.hpp"

GodObject::GodObject(Vector2D position)
    : m_position(position), m_tetherPosition(position), m_obstacleMutex(portMUX_INITIALIZER_UNLOCKED), m_possibleCollisions(new std::set<IndexedEdge>())
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

Hashtable& GodObject::hashtable()
{
    if (!m_hashtable)
    {
        m_hashtable = new Hashtable();
    }
    return *m_hashtable;
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
            hashtable().add(action->m_data.m_annotatedEdge);
            break;
        }
        case HT_DISABLE_EDGE:
        {
            hashtable().remove(action->m_data.m_annotatedEdge);
            break;
        }
        case GO_REMOVE_OBSTACLE:
        {
            try{

            delete m_obstacles.at(action->m_data.m_obstacleId);
            m_obstacles.erase(action->m_data.m_obstacleId);
            } catch (const std::out_of_range &oor){
                DPSerial::sendInstantDebugLog("Could not remove obstacle");
            }
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
    hashtable().print();
    portEXIT_CRITICAL(&m_obstacleMutex);
}

// returns if force is applied or not
bool GodObject::move(bool isTweening, bool isFrozen)
{
    auto lastState = m_processingObstacleCollision;
    // if the number of collisions increased since the last frame then we ran into a corner
    auto lastNumCollisions = m_numCollisions;
    
    m_processingObstacleCollision = false;


    Vector2D nextGoPosition;
    Vector2D handlePosition = m_position + m_movementDirection;
    if (isFrozen){
        renderForce(getCollisionForce(m_position, handlePosition), Vector2D(0,0));
        return true;
    }
    if (isTweening) {
        m_position = handlePosition;
        if (m_tethered) {
            m_tetherPosition = handlePosition;
        }
        return false;
    }
    float movementStepLength = m_movementDirection.length(); // only used for tethering
    if (m_tethered && !isTweening) {
        double distHandleToGo = m_movementDirection.length();
        if ((distHandleToGo < m_tetherInnerRadius) || (m_tetherState!=Outer && (distHandleToGo > 10))) {
            // the latter condition can happen at startup of the device.
            // in this case we don't want to apply forces.
            m_tetherState = Inner;
            return false;
        }
        // find out the current tether state
        if (distHandleToGo > m_tetherInnerRadius && distHandleToGo < m_tetherOuterRadius){
            m_tetherState = Active;
        } else {
            m_tetherState = Outer;
        }
        // the speed of the god object increases proportionally with the distance bw handle and go. The max speed of the go is dependent on the outer tether radius.
        movementStepLength = min(m_tetherOuterRadius, distHandleToGo);
        
        // this is the movement of the god object that follows the tether
        if (distHandleToGo != 0)
        {
            nextGoPosition = m_position + (m_movementDirection.normalize() * movementStepLength * m_tetherFactor);
        } else {
            nextGoPosition = handlePosition;
        }
    } else {
        nextGoPosition = handlePosition;
    }
    
    // no matter what the tether state is we need to check if the god object is colliding with an obstacle
    Vector2D godObjectPos;
    portENTER_CRITICAL(&m_obstacleMutex);
    if (m_tethered && m_tetherState == Outer && m_tetherStrategy == Exploration){
        // pausing the game means that the god object position doesn't update.
        godObjectPos = m_position;
    } else {
        // this is the default case
        godObjectPos = checkCollisions(nextGoPosition, m_position);
    }
    if (m_tethered && m_processingObstacleCollision && m_tetherState == Outer && m_tetherStrategy != MaxSpeed) {
        // for the Exploration and Leash mode the tether state can't be outer once the god object collides 
        // (otherwise the wall force will be weaker when the handle moves further into the wall)
        m_tetherState = Active;
    }

    // check if collision with a passable obstacle or a haptic guide is present
    if (m_tethered && m_processingObstacleCollision && m_tetherState == Active) {
        m_processingObstacleCollision = false;
        nextGoPosition = m_position + (m_movementDirection.normalize() * movementStepLength * c_railsTetherFactor);
        auto pos = checkCollisions(nextGoPosition, m_position);
        // if the handle is already past the obstacle (no more collision present) then the god object jumps to its position
        if (!m_processingObstacleCollision) {
            m_position = pos;
        } else {
            m_position = godObjectPos;
        }
    } else {
        m_position = godObjectPos;
    }

    //m_position = godObjectPos;
    if (m_tethered && m_tetherState == Outer && !isTweening && m_tetherStrategy != MaxSpeed) 
    {
        m_tetherPosition = checkCollisions(handlePosition, m_tetherPosition);
    } else {
        m_tetherPosition = handlePosition;
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
        // newCollision is only important for the pock
        bool newCollision = lastNumCollisions < m_numCollisions;
        return processTetheringForce(handlePosition, newCollision);
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

bool GodObject::processTetheringForce(Vector2D handlePosition, bool newCollision) {
    // returns if force is active or handle is freely moving
    if (m_tetherState==Outer && m_tetherStrategy!=MaxSpeed) {
        // for the 2 tether strategies where the god object is pulled on a virtual leash towards the tether position
        auto error = m_movementDirection.normalize() * c_tetherForcePullingBack;
        auto tetherForce = getTetherForce(error); //TODO: if we had a collision previously in Active state and moved from there into Outer state then the rendered force should be the sum of the previous force and the collision force
        if (m_processingObstacleCollision) {
            // think about adding a second pock here as well
            renderForce(getCollisionForce(m_tetherPosition, handlePosition), tetherForce);
        } else {
            // weak constant force pulling the tether back to the god object
            renderForce(Vector2D(0,0), tetherForce);
        }
        return true;
    } else {
        auto movementLength = (m_tetherPosition - m_position).length();
        auto error = m_movementDirection.normalize() * (m_tetherInnerRadius - movementLength);
        if (newCollision && m_tetherPockEnabled) {
            // weak constant force pushing the handle into the the wall so that the user gets force feedback at their fingertip
            error = m_movementDirection.normalize() * c_tetherPockDistance; // this can't work because we include the last tether error
        }
        auto tetherForce = getTetherForce(error);

        if (m_processingObstacleCollision) {
            // god object collision
            renderForce(getCollisionForce(m_position, handlePosition), tetherForce);
            return true;
        } else {
            if (!m_doneColliding) {
                // regular tether force active that pushes the handle back to the inner tether radius
                
                renderForce(Vector2D(0,0), tetherForce);
            }
            return !m_doneColliding;
        }
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

    if (currentPosition == targetPoint || !m_hashtable)
    {
        return targetPoint;
    }
    // 1. select collision candidates
    m_possibleCollisions->clear();
    hashtable().getPossibleCollisions(
        Edge(currentPosition, targetPoint), m_possibleCollisions);
    if (m_possibleCollisions->empty())
    {
        return targetPoint;
    }

    bool foundCollision;
    u_short numCollisions = 0;
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
                if (!ob->passable){
                    numCollisions++;
                }
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
            hashtable().getPossibleCollisions(
                Edge(currentPosition, targetPoint), m_possibleCollisions);
        }
        // there can be multiple collisions, that's why we have to loop as well over the other possible collisions
    } while (foundCollision);
    m_numCollisions = numCollisions;
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

void GodObject::setSpeedControl(bool active, double tetherFactor, double innerTetherRadius, double outerTetherRadius, OutOfTetherStrategy strategy, bool pockEnabled)
{
    m_tethered = active;
    m_tetherFactor = tetherFactor;
    m_tetherInnerRadius = innerTetherRadius;
    m_tetherOuterRadius = outerTetherRadius;
    m_tetherStrategy = strategy;
    m_tetherPockEnabled = pockEnabled;
}