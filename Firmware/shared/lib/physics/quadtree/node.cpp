#include "physics/quadtree/node.hpp"

#include "serial.hpp"

Node::Node(
    Branch* parent, uint8_t depth, Vector2D center, Vector2D size)
: m_parent(parent)
, m_depth(depth)
, m_center(center)
, m_size(size)
{
}

void Node::printThis(bool isLeaf)
{
    DPSerial::sendQueuedDebugLog(
        "%*c [%c] %p c %+08.3f|%+08.3f s %+08.3f|%+08.3f",
        m_depth * 2 + 1,
        ' ',
        (isLeaf ? 'L' : 'B'),
        this,
        m_center.x,
        m_center.y,
        m_size.x,
        m_size.y);
}
