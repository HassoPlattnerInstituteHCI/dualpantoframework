#pragma once

#include <Arduino.h>
#include <set>
#include <vector>

#include "../indexedEdge.hpp"
#include "../edge.hpp"
#include "../obstacle.hpp"
#include "node.hpp"
#include "utils.hpp"

class Branch : public Node
{
private:
    std::vector<Node*> m_children;
    std::set<Node*> getChildrenForPoint(Vector2D point);
    std::set<Node*> getChildrenForEdge(Edge edge);
public:
    Branch(Branch* parent, uint8_t depth, Vector2D center, Vector2D size);
    ~Branch() override;
    void add(Obstacle* obstacle, uint32_t index, Edge edge) override;
    void remove(Obstacle* obstacle, uint32_t index) override;
    std::set<IndexedEdge> getPossibleCollisions(Edge movement) override;
    void replace(Node* oldChild, Node* newChild);
};
