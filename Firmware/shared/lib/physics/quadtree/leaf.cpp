#include "physics/quadtree/leaf.hpp"

#include <sstream>

#include "physics/quadtree/branch.hpp"
#include "serial.hpp"

void Leaf::split()
{
    auto replacement = new Branch(m_parent, m_depth, m_center, m_size);

    for(auto&& child : m_children)
    {
        replacement->add(
            child.m_obstacle,
            child.m_index,
            child.m_obstacle->getEdge(child.m_index));
    }

    m_parent->replace(this, replacement);
    delete this;
}

Leaf::Leaf(
    Branch* parent, uint8_t depth, Vector2D center, Vector2D size)
: Node(parent, depth, center, size)
{
}

Leaf::~Leaf()
{
}

void Leaf::add(Obstacle* obstacle, uint32_t index, Edge edge)
{
    m_children.emplace_back(obstacle, index);
    if(m_children.size() > c_maxChildren && m_depth < c_maxDepth)
    {
        split();
    }
}

void Leaf::remove(Obstacle* obstacle, uint32_t index)
{
    auto child = std::find(
        m_children.begin(), 
        m_children.end(), 
        IndexedEdge{obstacle, index});
    if(child != m_children.end())
    {
        m_children.erase(child);
    }
}

std::set<IndexedEdge> Leaf::getPossibleCollisions(Edge movement)
{
    return std::set<IndexedEdge>(m_children.begin(), m_children.end());
}

std::vector<std::string> Leaf::print()
{
    std::vector<std::string> result;
    result.push_back(printThis(true));
    char buffer[256];
    for(auto&& child : m_children)
    {
        auto edge = child.m_obstacle->getEdge(child.m_index);
        snprintf(
            buffer,
            256,
            "%*c [E] %p->%i 0 %+08.3f|%+08.3f 1 %+08.3f|%+08.3f",
            (m_depth + 1) * 2 + 1,
            ' ',
            child.m_obstacle,
            child.m_index,
            edge.m_first.x,
            edge.m_first.y,
            edge.m_second.x,
            edge.m_second.y);
        result.emplace_back(buffer);
    }
    return result;
}
