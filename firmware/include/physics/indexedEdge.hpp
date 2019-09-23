#pragma once

#include <Arduino.h>

#include "physics/edge.hpp"

class Obstacle;

struct IndexedEdge
{
    Obstacle* m_obstacle;
    uint32_t m_index;
    IndexedEdge(Obstacle* obstacle, uint32_t index);
    bool operator==(const IndexedEdge& other) const;
    bool operator<(const IndexedEdge& other) const;
    Edge getEdge() const;
};
