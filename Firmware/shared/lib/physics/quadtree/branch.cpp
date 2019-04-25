#include "physics/quadtree/branch.hpp"

#include <algorithm>

#include "physics/quadtree/leaf.hpp"
#include "serial.hpp"

std::set<Node*> Branch::getChildrenForPoint(
    Vector2D point)
{
    std::set<Node*> result;

    if(point.x < m_center.x)
    {
        if(point.y < m_center.y)
        {
            return std::set<Node*>{m_children[0]};
        }
        else if(point.y > m_center.y)
        {
            return std::set<Node*>{m_children[1]};
        }
        else
        {
            return std::set<Node*>{m_children[0], m_children[1]};
        }
    }
    else if(point.x > m_center.x)
    {
        if(point.y < m_center.y)
        {
            return std::set<Node*>{m_children[2]};
        }
        else if(point.y > m_center.y)
        {
            return std::set<Node*>{m_children[3]};
        }
        else
        {
            return std::set<Node*>{m_children[2], m_children[3]};
        }
    }
    else
    {
        if(point.y < m_center.y)
        {
            return std::set<Node*>{m_children[0], m_children[2]};
        }
        else if(point.y > m_center.y)
        {
            return std::set<Node*>{m_children[1], m_children[3]};
        }
        else
        {
            return std::set<Node*>{
                m_children[0], m_children[1], m_children[2], m_children[3]};
        }
    }
}

std::set<Node*> Branch::getChildrenForEdge(Edge edge)
{
    auto diff = edge.m_second - edge.m_first;

    if(diff.x == 0 && diff.y == 0)
    {
        return getChildrenForPoint(edge.m_first);
    }

    auto startChildren = getChildrenForPoint(edge.m_first);
    auto endChildren = getChildrenForPoint(edge.m_second);

    std::set<Node*> result;
    result.insert(startChildren.begin(), startChildren.end());
    result.insert(endChildren.begin(), endChildren.end());

    if(diff.x > diff.y)
    {
        // use 0 = mx+n for linear function
        auto m = diff.y / diff.x;
        // n = y1 - m * x1 && zero = -n / m => zero = x1 - y1 / m
        auto zero = edge.m_first.x - edge.m_first.y / m;

        if(zero <= 0)
        {
            result.insert(m_children[0]);
            result.insert(m_children[2]);
        }
        if(zero >= 0)
        {
            result.insert(m_children[1]);
            result.insert(m_children[3]);
        }
    }
    else
    {
        auto m = diff.y / diff.x;
        auto zero = edge.m_first.y - edge.m_first.x / m;

        if(zero <= 0)
        {
            result.insert(m_children[0]);
            result.insert(m_children[1]);
        }
        if(zero >= 0)
        {
            result.insert(m_children[2]);
            result.insert(m_children[3]);
        }
    }
    
    return result;
}

Branch::Branch(
    Branch* parent, uint8_t depth, Vector2D center, Vector2D size)
: Node(parent, depth, center, size)
{
    m_children.push_back(
        new Leaf(
            this,
            depth + 1,
            center - size * 0.25,
            size * 0.5));
    m_children.push_back(
        new Leaf(
            this,
            depth + 1,
            Vector2D(center.x + size.x * 0.25, center.x - size.x * 0.25),
            size * 0.5));
    m_children.push_back(
        new Leaf(
            this,
            depth + 1,
            Vector2D(center.x - size.x * 0.25, center.x + size.x * 0.25),
            size * 0.5));
    m_children.push_back(
        new Leaf(
            this,
            depth + 1,
            center + size * 0.25,
            size * 0.5));
}

Branch::~Branch()
{
    for(auto& child : m_children)
    {
        delete child;
    }
}

void Branch::add(Obstacle* obstacle, uint32_t index, Edge edge)
{
    DPSerial::sendDebugLog("adding at lvl %i", m_depth);
    for(auto&& child : getChildrenForEdge(edge))
    {
        child->add(obstacle, index, edge);
    }
}

void Branch::remove(Obstacle* obstacle, uint32_t index)
{
    for(auto&& child : getChildrenForEdge(obstacle->getEdge(index)))
    {
        child->remove(obstacle, index);
    }
}

std::set<IndexedEdge> Branch::getPossibleCollisions(Edge movement)
{
    std::set<IndexedEdge> result;

    for(auto&& child : getChildrenForEdge(movement))
    {
        auto childCollisions = child->getPossibleCollisions(movement);
        result.insert(childCollisions.begin(), childCollisions.end());
    }

    return result;
}

void Branch::replace(Node* oldChild, Node* newChild)
{
    auto child = std::find(m_children.begin(), m_children.end(), oldChild);
    *child = newChild;
}
