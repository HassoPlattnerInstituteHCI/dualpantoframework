#include "physics/pantoPhysics.hpp"
#include "serial.hpp"

std::vector<PantoPhysics> pantoPhysics;

PantoPhysics::PantoPhysics(Panto* panto) : m_panto(panto)
{
    m_currentPosition = m_panto->handle;
    m_godObject = GodObject(m_currentPosition);
}

void PantoPhysics::addObstacle(std::vector<Vector2D> points)
{
    m_obstacles.emplace_back(points);
    m_godObject.addObstacle(m_obstacles.back());
}

void PantoPhysics::step()
{
    m_currentPosition = m_panto->handle;

    DPSerial::sendDebugLog("getPosition");
    auto difference = m_currentPosition - m_godObject.getPosition();
    m_godObject.setMovementDirection(difference);
    DPSerial::sendDebugLog("move");
    m_godObject.move();
    DPSerial::sendDebugLog("getProcessingObstacleCollision");
    if(m_godObject.getProcessingObstacleCollision())
    {
        DPSerial::sendDebugLog("true");
        m_panto->isforceRendering = true;
        m_panto->target = m_godObject.getActiveForce();
        m_panto->inverseKinematics();
    }
    else if(m_godObject.getDoneColliding())
    {
        DPSerial::sendDebugLog("false");
        m_panto->isforceRendering = true;
        m_panto->target = Vector2D();
        m_panto->inverseKinematics();
    }
    DPSerial::sendDebugLog("end");
}