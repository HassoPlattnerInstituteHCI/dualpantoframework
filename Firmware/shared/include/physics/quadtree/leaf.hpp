#pragma once

#include "../indexedEdge.hpp"
#include "../edge.hpp"
#include "node.hpp"
#include "../obstacle.hpp"
#include "utils.hpp"

class Leaf : public Node
{
private:
    static const uint8_t c_maxDepth = 10;
    static const uint8_t c_maxChildren = 8;
    std::vector<IndexedEdge> m_children;
    void split();
public:
    Leaf(Branch* parent, uint8_t depth, Vector2D center, Vector2D size);
    ~Leaf() override;
    void add(Obstacle* obstacle, uint32_t index, Edge edge) override;
    void remove(Obstacle* obstacle, uint32_t index) override;
    std::set<IndexedEdge> getPossibleCollisions(Edge movement) override;
};
