#include "physics/pantoPhysics.hpp"

#include "serial.hpp"

std::vector<PantoPhysics> pantoPhysics;

PantoPhysics::PantoPhysics(Panto* panto) : m_panto(panto)
{
    m_currentPosition = m_panto->handle;
    try
    {
        m_godObject = new GodObject(panto, m_currentPosition);
    }
    catch(const std::bad_alloc& e)
    {
        DPSerial::sendInstantDebugLog("Error while creating god object - the hash table may be too big.");
        DPSerial::sendInstantDebugLog("Error: %s", e.what());
        DPSerial::sendInstantDebugLog("Rebooting...");
        ESP.restart();
    }
}

GodObject* PantoPhysics::godObject()
{
    return m_godObject;
}

void PantoPhysics::step()
{
    m_godObject->updateHashtable();

    m_currentPosition = m_panto->handle;

    auto difference = m_currentPosition - m_godObject->getPosition();
    m_godObject->setMovementDirection(difference);
    m_godObject->move();
    if(m_godObject->getProcessingObstacleCollision())
    {
        m_panto->isforceRendering = true;
        m_panto->target = m_godObject->getActiveForce();
        m_panto->inverseKinematics();
    }
    else if(m_godObject->getDoneColliding())
    {
        m_panto->isforceRendering = false;
        m_panto->target = Vector2D(NAN, NAN);
        m_panto->inverseKinematics();
    }
}
