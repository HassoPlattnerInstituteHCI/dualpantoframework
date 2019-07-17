#include "physics/indexedEdge.hpp"

#include "physics/obstacle.hpp"

IndexedEdge::IndexedEdge(Obstacle* obstacle, uint32_t index)
: m_obstacle(obstacle)
, m_index(index)
{
}

bool IndexedEdge::operator==(const IndexedEdge& other) const
{
    return m_obstacle == other.m_obstacle && m_index == other.m_index;
}

bool IndexedEdge::operator<(const IndexedEdge& other) const
{
    return m_obstacle == other.m_obstacle ?
        m_index < other.m_index :
        m_obstacle < other.m_obstacle;
}

Edge IndexedEdge::getEdge() const
{
    return m_obstacle->getEdge(m_index);
}
