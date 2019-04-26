#include "physics/quadtree/branch.hpp"

#include <algorithm>

#include "physics/quadtree/leaf.hpp"
#include "serial.hpp"

std::set<Node*> Branch::getChildrenForPoint(
    Vector2D point)
{
    std::set<Node*> result;

    auto hIndex = -1.0;
    if(point.x > m_center.x - m_size.x / 2) hIndex++;
    if(point.x == m_center.x) hIndex += 0.5;
    if(point.x > m_center.x) hIndex += 0.5;
    if(point.x > m_center.x + m_size.x / 2) hIndex++;

    auto vIndex = -1.0;
    if(point.y > m_center.y - m_size.y / 2) vIndex++;
    if(point.y == m_center.y) vIndex += 0.5;
    if(point.y > m_center.y) vIndex += 0.5;
    if(point.y > m_center.y + m_size.y / 2) vIndex++;

    if(hIndex < 0 || hIndex > 1 || vIndex < 0 || vIndex > 1)
    {
        return result;
    }

    result.insert(m_children[std::floor(hIndex) + 2 * std::floor(vIndex)]);
    result.insert(m_children[std::ceil(hIndex) + 2 * std::floor(vIndex)]);
    result.insert(m_children[std::floor(hIndex) + 2 * std::ceil(vIndex)]);
    result.insert(m_children[std::ceil(hIndex) + 2 * std::ceil(vIndex)]);

    return result;
}

std::set<Node*> Branch::getChildrenForEdge(Edge edge)
{
    auto diff = edge.m_second - edge.m_first;

    if(diff.x == 0 && diff.y == 0)
    {
        //DPSerial::sendDebugLog("diff 0");
        return getChildrenForPoint(edge.m_first);
    }

    auto startChildren = getChildrenForPoint(edge.m_first);
    auto endChildren = getChildrenForPoint(edge.m_second);

    std::set<Node*> result;
    result.insert(startChildren.begin(), startChildren.end());
    result.insert(endChildren.begin(), endChildren.end());

    if(diff.x > diff.y)
    {
        // use y = mx+n for linear function
        // try to find location for y = center.y
        auto m = diff.y / diff.x;
        // n = y1 - m * x1 && x = (y - n) / m => x = (y - y1) / m + x1
        auto x = (m_center.y - edge.m_first.y) / m + edge.m_first.x;

        if(x > m_center.x - m_size.x / 2 && x <= m_center.x)
        {
            result.insert(m_children[0]);
            result.insert(m_children[2]);
        }
        if(x >= m_center.x && x < m_center.x + m_size.x / 2)
        {
            result.insert(m_children[1]);
            result.insert(m_children[3]);
        }
    }
    else
    {
        auto m = diff.x / diff.y;
        auto y = (m_center.x - edge.m_first.x) / m + edge.m_first.y;

        if(y > m_center.y - m_size.y / 2 && y <= m_center.y)
        {
            result.insert(m_children[0]);
            result.insert(m_children[1]);
        }
        if(y >= m_center.y && y < m_center.y + m_size.y / 2)
        {
            result.insert(m_children[2]);
            result.insert(m_children[3]);
        }
    }
    
    // DPSerial::sendDebugLog("p1 %+08.3f|%+08.3f p2 %+08.3f|%+08.3f c %+08.3f|%+08.3f s %+08.3f|%+08.3f sel %i|%i|%i|%i", edge.m_first.x, edge.m_first.y, edge.m_second.x, edge.m_second.y, m_center.x, m_center.y, m_size.x, m_size.y, result.find(m_children[0]) != result.end(), result.find(m_children[1]) != result.end(), result.find(m_children[2]) != result.end(), result.find(m_children[3]) != result.end());
    // yield();
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
    // DPSerial::sendDebugLog("branch adding at lvl %i", m_depth);
    auto c = getChildrenForEdge(edge);
    // DPSerial::sendDebugLog("num of children %i", c.size());
    for(auto&& child : c)
    {
        // DPSerial::sendDebugLog("adding to %i", child);
        child->add(obstacle, index, edge);
        // yield();
    }
}

void Branch::remove(Obstacle* obstacle, uint32_t index)
{
    for(auto&& child : getChildrenForEdge(obstacle->getEdge(index)))
    {
        // DPSerial::sendDebugLog("removing from %i", child);
        child->remove(obstacle, index);
        // yield();
    }
}

std::set<IndexedEdge> Branch::getPossibleCollisions(Edge movement)
{
    std::set<IndexedEdge> result;

    for(auto&& child : getChildrenForEdge(movement))
    {
        if(child == nullptr)
            DPSerial::sendDebugLog("getting collisions from %i", child);
        auto childCollisions = child->getPossibleCollisions(movement);
        result.insert(childCollisions.begin(), childCollisions.end());
    }

    return result;
}

std::vector<std::string> Branch::print()
{
    std::vector<std::string> result;
    result.push_back(printThis(false));
    for(auto&& child : m_children)
    {
        auto childResult = child->print();
        result.insert(result.end(), childResult.begin(), childResult.end());
    }
    return result;
}

void Branch::replace(Node* oldChild, Node* newChild)
{
    // DPSerial::sendDebugLog("replacing %i with %i", oldChild, newChild);
    auto child = std::find(m_children.begin(), m_children.end(), oldChild);
    *child = newChild;
}
