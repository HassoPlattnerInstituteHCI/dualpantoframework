#pragma once

#include <vector>

#include "physics/edge.hpp"
#include "utils/vector.hpp"

class Collider
{
protected:
    std::vector<Vector2D> m_points;
public:
    Collider(std::vector<Vector2D> points);
    void add(std::vector<Vector2D> points);
    virtual bool contains(Vector2D point);
    Edge getEdge(uint32_t index);
};
