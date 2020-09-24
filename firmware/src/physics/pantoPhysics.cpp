#include "physics/pantoPhysics.hpp"

#include "utils/performanceMonitor.hpp"
#include "utils/serial.hpp"

std::vector<PantoPhysics> pantoPhysics;

PantoPhysics::PantoPhysics(Panto* panto) : m_panto(panto)
{
    m_currentPosition = m_panto->getPosition();
    try
    {
        m_godObject = new GodObject(m_currentPosition);
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
    // PERFMON_START("[ba] Physics::step");
    // PERFMON_START("[baa] Physics::step::prep");
    m_godObject->update();

    m_currentPosition = m_panto->getPosition();

    auto difference = m_currentPosition - m_godObject->getPosition();
    m_godObject->setMovementDirection(difference);
    // PERFMON_STOP("[baa] Physics::step::prep");
    // PERFMON_START("[bab] Physics::step::move");
    bool isMoving = m_godObject->move();
    // PERFMON_STOP("[bab] Physics::step::move");
    // PERFMON_START("[bac] Physics::step::motor");
    if(m_godObject->getProcessingObstacleCollision())
    {
        m_panto->setTarget(m_godObject->getActiveForce(), true);
    }
    else if(m_godObject->getDoneColliding())
    {
        m_panto->setTarget(Vector2D(NAN, NAN), false);
    } else 
    {
        // here the handle is free
        //DPSerial::sendInstantDebugLog("Diff : %f", difference.length());
        //DPSerial::sendInstantDebugLog("Force : %f", m_godObject->getActiveForce());
        if (m_godObject->tethered() && difference.length() < 5)
        {
            if (!isMoving) {
                m_panto->setTarget(Vector2D(NAN, NAN), false);
            } else {
                m_panto->setTarget(m_godObject->getActiveForce(), true);
            }
        }
    }
    // PERFMON_STOP("[bac] Physics::step::motor");
    // PERFMON_STOP("[ba] Physics::step");
}
