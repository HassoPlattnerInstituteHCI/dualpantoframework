#include "physics/quadtree/quadtree.hpp"

#include <map>
#include <tuple>

#include "serial.hpp"

std::pair<Vector2D, Vector2D> Quadtree::getRangeForPanto(Panto* panto)
{
    auto left = getRangeForMotor(panto->dofIndex);
    auto right = getRangeForMotor(panto->dofIndex + 1);

    auto min = Vector2D::min(left.first, right.first);
    auto max = Vector2D::max(left.second, right.second);

    return std::make_pair((min + max) * 0.5, max - min);
}

std::pair<Vector2D, Vector2D> Quadtree::getRangeForMotor(uint8_t index)
{
    auto center = Vector2D(linkageBaseX[index], linkageBaseY[index]);
    auto range = linkageInnerLength[index] + linkageOuterLength[index];
    auto size = Vector2D(range, range);
    return std::make_pair(center - size, center + size);
}

void Quadtree::add(Obstacle* obstacle, uint32_t index, Edge edge)
{
    m_base->add(obstacle, index, edge);
}

void Quadtree::remove(Obstacle* obstacle, uint32_t index)
{
    m_base->remove(obstacle, index);
}

Quadtree::Quadtree(Panto* panto)
{
    auto range = getRangeForPanto(panto);
    m_base = new Branch(nullptr, 0, range.first, range.second);
}

void Quadtree::add(
    const std::vector<std::tuple<Obstacle*, uint32_t, Edge>>& elements)
{
    m_addQueue.insert(m_addQueue.end(), elements.begin(), elements.end());
}

void Quadtree::remove(
    const std::vector<std::tuple<Obstacle*, uint32_t, Edge>>& elements)
{
    m_addQueue.insert(m_removeQueue.end(), elements.begin(), elements.end());
}

void Quadtree::processQueues()
{
    if(!m_addQueue.empty())
    {
        auto edge = m_addQueue.front();
        m_addQueue.pop_front();
        add(std::get<0>(edge), std::get<1>(edge), std::get<2>(edge));
    }
    if(!m_removeQueue.empty())
    {
        auto edge = m_removeQueue.front();
        m_removeQueue.pop_front();
        remove(std::get<0>(edge), std::get<1>(edge));
    }
}

std::vector<IndexedEdge> Quadtree::getCollisions(Edge movement)
{
    auto edges = m_base->getPossibleCollisions(movement);
    std::map<Obstacle*, std::vector<uint32_t>> grouped;

    for(auto&& edge : edges)
    {
        grouped[edge.m_obstacle].push_back(edge.m_index);
    }

    std::vector<IndexedEdge> result;
    uint32_t enteringEdgeIndex;
    for(auto&& obstacle : grouped)
    {
        if(obstacle.first->getEnteringEdge(
            movement, obstacle.second, &enteringEdgeIndex))
        {
            result.emplace_back(obstacle.first, enteringEdgeIndex);
        }
    }

    return result;
}

void Quadtree::print()
{
    auto lines = m_base->print();
    for(auto&& line : lines)
    {
        DPSerial::sendDebugLog(line.c_str());
    }
}
