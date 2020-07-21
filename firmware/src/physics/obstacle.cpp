#include "physics/obstacle.hpp"

#include "physics/indexedEdge.hpp"

Obstacle::Obstacle(std::vector<Vector2D> points) : Collider(points) { }

Obstacle::Obstacle(std::vector<Vector2D> points, bool passable) : Collider(points)
{
    this->passable = passable;
}

bool Obstacle::enabled()
{
    return m_enabled;
}

void Obstacle::enable(bool enable)
{
    m_enabled = enable;
}

std::vector<IndexedEdge> Obstacle::getIndexedEdges(
    uint32_t first, uint32_t last
)
{
    if(first == -1)
    {
        first = m_points.size() - 1;
    }
    if(last == -1)
    {
        last = m_points.size() - 1;
    }
    std::vector<IndexedEdge> result;
    for(auto i = first; i <= last; ++i)
    {
        result.emplace_back(this, i);
    }
    return result;
}
