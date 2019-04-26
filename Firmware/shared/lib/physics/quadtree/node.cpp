#include "physics/quadtree/node.hpp"

Node::Node(
    Branch* parent, uint8_t depth, Vector2D center, Vector2D size)
: m_parent(parent)
, m_depth(depth)
, m_center(center)
, m_size(size)
{
}

std::string Node::printThis(bool isLeaf)
{
    char buffer[256];
    snprintf(
        buffer,
        256,
        "%*c [%c] %p c %+08.3f|%+08.3f s %+08.3f|%+08.3f",
        m_depth * 2 + 1,
        ' ',
        (isLeaf ? 'L' : 'B'),
        this,
        m_center.x,
        m_center.y,
        m_size.x,
        m_size.y);
    return std::string(buffer);
}
