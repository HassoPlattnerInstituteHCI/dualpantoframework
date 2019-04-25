#pragma once

#include <Arduino.h>
#include <set>

#include "../indexedEdge.hpp"
#include "../edge.hpp"
#include "../obstacle.hpp"
#include "utils.hpp"

class Branch;

class Node
{
protected:
    Branch* m_parent;
    uint8_t m_depth;
    Vector2D m_center;
    Vector2D m_size;
    Node(Branch* parent, uint8_t depth, Vector2D center, Vector2D size);
public:
    virtual ~Node() = default;
    virtual void add(Obstacle* obstacle, uint32_t index, Edge edge) = 0;
    virtual void remove(Obstacle* obstacle, uint32_t index) = 0;
    virtual std::set<IndexedEdge> getPossibleCollisions(Edge movement) = 0;
};
