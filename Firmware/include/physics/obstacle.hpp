#pragma once

#include <tuple>
#include <vector>

#include "physics/annotatedEdge.hpp"
#include "physics/collider.hpp"

class Obstacle : public Collider
{
private:
    bool m_enabled = false;
public:
    Obstacle(std::vector<Vector2D> points);
    bool enabled();
    void enable(bool enable = true);
    std::vector<AnnotatedEdge> getAnnotatedEdges(
        uint32_t first = 0, uint32_t last = -1);
};
