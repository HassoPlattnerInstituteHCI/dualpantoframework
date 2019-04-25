#include "physics/quadtree/node.hpp"

Node::Node(
    Branch* parent, uint8_t depth, Vector2D center, Vector2D size)
: m_parent(parent)
, m_depth(depth)
, m_center(center)
, m_size(size)
{
}
