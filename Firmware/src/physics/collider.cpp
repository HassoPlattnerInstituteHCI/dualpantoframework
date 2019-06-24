#include "physics/collider.hpp"

#include "utils/serial.hpp"

Collider::Collider(std::vector<Vector2D> points) : m_points(points) { }

void Collider::add(std::vector<Vector2D> points)
{
    m_points.insert(m_points.end(), points.begin(), points.end());
}

bool Collider::contains(Vector2D point)
{
    // will contain result
    auto inside = false;
    // loop vars
    auto edgeCount = m_points.size();
    auto j = edgeCount - 1;
    // pre-allocate
    Vector2D first, second;

    for(auto i = 0; i < edgeCount; ++i)
    {
        first = m_points[i];
        second = m_points[j];
        if ((first.y > point.y) != (second.y > point.y) &&
            (point.x < 
                first.x + 
                (second.x - first.x) * 
                (point.y - first.y) / 
                (second.y - first.y)))
        {
            inside = !inside;
        }
        j = i;
    }

    return inside;
}

Edge Collider::getEdge(uint32_t index)
{
    return Edge(
        m_points[index % m_points.size()], 
        m_points[(index + 1) % m_points.size()]);
}
