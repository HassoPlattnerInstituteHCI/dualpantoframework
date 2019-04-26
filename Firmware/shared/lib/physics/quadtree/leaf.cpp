#include "physics/quadtree/leaf.hpp"

#include <sstream>

#include "physics/quadtree/branch.hpp"
#include "serial.hpp"

void Leaf::split()
{
    // DPSerial::sendDebugLog("starting split");
    auto replacement = new Branch(m_parent, m_depth, m_center, m_size);

    for(auto&& child : m_children)
    {
        // DPSerial::sendDebugLog("Free heap: %i", xPortGetFreeHeapSize());
        replacement->add(
            child.m_obstacle,
            child.m_index,
            child.m_obstacle->getEdge(child.m_index));
    }

    m_parent->replace(this, replacement);
    delete this;
    // DPSerial::sendDebugLog("commited suicide");
    // yield();
}

Leaf::Leaf(
    Branch* parent, uint8_t depth, Vector2D center, Vector2D size)
: Node(parent, depth, center, size)
{
}

Leaf::~Leaf()
{
}

void Leaf::add(Obstacle* obstacle, uint32_t index, Edge edge)
{
    // DPSerial::sendDebugLog("leaf adding at lvl %i", m_depth);
    // DPSerial::sendDebugLog("emplace");
    m_children.emplace_back(obstacle, index);
    // DPSerial::sendDebugLog("check");
    if(m_children.size() > c_maxChildren && m_depth < c_maxDepth)
    {
        // DPSerial::sendDebugLog("need to split %i on lvl %i - parent %i center %+08.3f|%+08.3f size %+08.3f|%+08.3f #ch %i", this, m_depth, m_parent, m_center.x, m_center.y, m_size.x, m_size.y, m_children.size());
        split();
    }
    // DPSerial::sendDebugLog("done");
    // yield();
    // ESP_ERROR_CHECK_WITHOUT_ABORT(esp_task_wdt_reset());
}

void Leaf::remove(Obstacle* obstacle, uint32_t index)
{
    auto child = std::find(
        m_children.begin(), 
        m_children.end(), 
        IndexedEdge{obstacle, index});
    if(child != m_children.end())
    {
        m_children.erase(child);
    }
    // yield();
}

std::set<IndexedEdge> Leaf::getPossibleCollisions(Edge movement)
{
    // std::set<IndexedEdge> result;
    // Vector2D intersection;
    // for(auto&& child : m_children)
    // {
    //     if(child.m_obstacle->intersect(child.m_index, movement, ))
    // }
    return std::set<IndexedEdge>(m_children.begin(), m_children.end());
    // yield();
}

std::vector<std::string> Leaf::print()
{
    std::vector<std::string> result;
    result.push_back(printThis(true));
    char buffer[256];
    for(auto&& child : m_children)
    {
        auto edge = child.m_obstacle->getEdge(child.m_index);
        snprintf(
            buffer,
            256,
            "%*c [E] %p->%i 0 %+08.3f|%+08.3f 1 %+08.3f|%+08.3f",
            (m_depth + 1) * 2 + 1,
            ' ',
            child.m_obstacle,
            child.m_index,
            edge.m_first.x,
            edge.m_first.y,
            edge.m_second.x,
            edge.m_second.y);
        result.emplace_back(buffer);
    }
    return result;
}
