#include "physics/obstacle.hpp"

Obstacle::Obstacle(std::vector<Vector2D> points) : Collider(points) { }

bool Obstacle::enabled()
{
    return m_enabled;
}

void Obstacle::enable(bool enable)
{
    m_enabled = enable;
}

std::vector<std::tuple<Obstacle*, uint32_t, Edge>> Obstacle::getAnnotatedEdges(
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
    std::vector<std::tuple<Obstacle*, uint32_t, Edge>> result;
    for(auto i = first; i <= last; ++i)
    {
        result.emplace_back(this, i, getEdge(i));
    }
    return result;
}
