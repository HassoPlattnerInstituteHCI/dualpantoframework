#pragma once

#include <vector>

#include "collision.hpp"
#include "edge.hpp"
#include "obstacle.hpp"
#include "utils.hpp"

class Quadtree
{
private:
    static const uint8_t c_maxDepth = 8;
    static const uint8_t c_maxChildren = 8;
    static Edge getRangeForMotor(uint8_t index);

    struct AnnotatedEdge
    {
        Obstacle* m_obstacle;
        uint32_t m_index;
    };

    class Node
    {
    private:
        bool m_isLeaf;
        Node* m_parent;
        uint8_t m_depth;
        Vector2D m_center;
        Vector2D m_size;
    protected:
        Node(Node* parent, uint8_t depth, Vector2D center, Vector2D size);
    public:
        void add(Obstacle* obstacle, uint32_t index, Edge edge);
        void remove(Obstacle* obstacle, uint32_t index);
        std::vector<Collision> getCollisions(Edge movement);
    };

    class Branch : Node
    {
    private:
        std::vector<Node*> m_children;
    public:
        Branch(Node* parent, uint8_t depth, Vector2D center, Vector2D size);
    };

    class Leaf : Node
    {
    private:
        std::vector<AnnotatedEdge> m_children;
    public:
        Leaf(Node* parent, uint8_t depth, Vector2D center, Vector2D size);
    };

    Branch m_base;
public:
    Quadtree();
    void add(Obstacle* obstacle, uint32_t index, Edge edge);
    void remove(Obstacle* obstacle, uint32_t index);
    std::vector<Collision> getCollisions(Edge movement);
};
