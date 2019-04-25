#include "physics/quadtree/leaf.hpp"

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
    DPSerial::sendDebugLog("adding at lvl %i", m_depth);
    m_children.emplace_back(obstacle, index);
    if(m_children.size() > c_maxChildren && m_depth < c_maxDepth)
    {
        DPSerial::sendDebugLog("need to split");
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
    // std::set<IndexedEdge> result;
    // Vector2D intersection;
    // for(auto&& child : m_children)
    // {
    //     if(child.m_obstacle->intersect(child.m_index, movement, ))
    // }
    return std::set<IndexedEdge>(m_children.begin(), m_children.end());
}
