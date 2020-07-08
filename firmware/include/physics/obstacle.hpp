#pragma once

#include <tuple>
#include <vector>

#include "physics/indexedEdge.hpp"
#include "physics/collider.hpp"

class Obstacle : public Collider
{
private:
    bool m_enabled = false;

public:
    uint16_t id = 0;
    bool passable = false;
    Obstacle(std::vector<Vector2D> points);
    Obstacle(std::vector<Vector2D> points, uint16_t id, bool passable);
    bool enabled();
    void enable(bool enable = true);
    virtual bool isOvercome(Vector2D target) { return false; };
    std::vector<IndexedEdge> getIndexedEdges(
        uint32_t first = 0, uint32_t last = -1);
};
