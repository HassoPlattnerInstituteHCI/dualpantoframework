#include "physics/quadtree.hpp"

Quadtree::Quadtree()
{
    m_base = Branch(nullptr, 0, Vector2D(), Vector2D(2, 2));
};

void Quadtree::add(Obstacle* obstacle, uint32_t index, Edge edge)
{

};
