#include "physics/hapticGraph.hpp"

HapticGraph::HapticGraph(double captureRadius, double junctionRadius, double breakawayDistance, double p, double i, double d)
    : m_captureRadius(captureRadius), m_junctionRadius(junctionRadius), m_breakawayDistance(breakawayDistance), m_p(p), m_i(i), m_d(d)
{
    // a handle that was just captured must not count as breaking away right away
    if (m_breakawayDistance > 0 && m_breakawayDistance < 2 * m_captureRadius)
    {
        m_breakawayDistance = 2 * m_captureRadius;
    }
}

void HapticGraph::addNode(const NodeData& data)
{
    auto& node = m_nodes[data.id];
    node.position = data.position;
    node.isEntry = data.isEntry;
}

bool HapticGraph::addEdge(uint16_t firstId, uint16_t secondId)
{
    auto first = m_nodes.find(firstId);
    auto second = m_nodes.find(secondId);
    if (first == m_nodes.end() || second == m_nodes.end())
    {
        return false;
    }
    // a way without length has no direction to walk along
    if (first->second.position == second->second.position)
    {
        return false;
    }

    m_edges.push_back({&first->second, &second->second});
    first->second.edges.push_back(&m_edges.back());
    second->second.edges.push_back(&m_edges.back());
    return true;
}

bool HapticGraph::enabled() const
{
    return m_enabled;
}

void HapticGraph::enable(bool enable)
{
    m_enabled = enable;
}

bool HapticGraph::findEntry(const Vector2D& handle, Position& result) const
{
    bool found = false;
    double closestDistance = m_captureRadius;
    for (auto& element : m_nodes)
    {
        auto& node = element.second;
        if (!node.isEntry || node.edges.empty())
        {
            continue;
        }
        auto distance = (node.position - handle).length();
        if (distance <= closestDistance)
        {
            closestDistance = distance;
            result.edge = node.edges.front();
            result.ratio = result.edge->first == &node ? 0 : 1;
            found = true;
        }
    }
    return found;
}

double HapticGraph::closestRatio(const Edge& edge, const Vector2D& point)
{
    auto direction = edge.second->position - edge.first->position;
    auto ratio = ((point - edge.first->position) * direction) / (direction * direction);
    if (ratio < 0)
    {
        return 0;
    }
    return ratio > 1 ? 1 : ratio;
}

void HapticGraph::walk(Position& position, const Vector2D& target) const
{
    for (auto step = 0; step < c_maxWalkSteps; ++step)
    {
        position.ratio = closestRatio(*position.edge, target);
        if (!switchWay(position, target))
        {
            return;
        }
    }
}

bool HapticGraph::switchWay(Position& position, const Vector2D& target) const
{
    const auto point = pointAt(position);
    const auto distance = (point - target).length();
    double closestDistance = distance;
    Position closest;

    Node* const nodes[] = {position.edge->first, position.edge->second};
    for (auto node : nodes)
    {
        // The handle practically never hits a node exactly. Without the radius it couldn't turn at a
        // crossing, because the god object would just continue on the straight way past the node.
        const auto distanceToNode = (node->position - point).length();
        if (distanceToNode > m_junctionRadius && distanceToNode > 0)
        {
            continue;
        }
        const auto margin = distanceToNode > 0 ? c_junctionHysteresis : c_walkEpsilon;
        for (auto edge : node->edges)
        {
            if (edge == position.edge)
            {
                continue;
            }
            Position candidate;
            candidate.edge = edge;
            candidate.ratio = closestRatio(*edge, target);
            const auto candidateDistance = (pointAt(candidate) - target).length();
            if (candidateDistance < distance - margin && candidateDistance < closestDistance)
            {
                closestDistance = candidateDistance;
                closest = candidate;
            }
        }
    }

    if (closest.edge == nullptr)
    {
        return false;
    }
    position = closest;
    return true;
}

Vector2D HapticGraph::pointAt(const Position& position)
{
    auto first = position.edge->first->position;
    return first + (position.edge->second->position - first) * position.ratio;
}

bool HapticGraph::isBreakingAway(const Vector2D& error) const
{
    return m_breakawayDistance > 0 && error.length() > m_breakawayDistance;
}

Vector2D HapticGraph::computeForce(const Vector2D& error)
{
    m_filteredDerivative =
        m_filteredDerivative * (1 - c_derivativeFilter) + (error - m_lastError) * c_derivativeFilter;
    m_lastError = error;

    m_integral = m_integral + error * m_i;
    auto integralLength = m_integral.length();
    if (integralLength > c_integralLimit)
    {
        m_integral = m_integral * (c_integralLimit / integralLength);
    }

    return error * m_p + m_integral + m_filteredDerivative * m_d;
}

void HapticGraph::resetForce(const Vector2D& error)
{
    m_lastError = error;
    m_filteredDerivative = Vector2D(0, 0);
    m_integral = Vector2D(0, 0);
}
