#include "physics/pantoPhysics.hpp"

std::vector<PantoPhysics> pantoPhysics;

PantoPhysics::PantoPhysics(Panto* panto) : m_panto(panto)
{
    m_currentPosition = m_panto->handle;
    m_godObject = new GodObject(panto, m_currentPosition);
}

GodObject* PantoPhysics::godObject()
{
    return m_godObject;
}

void PantoPhysics::step()
{
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
