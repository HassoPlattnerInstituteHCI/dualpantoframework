#pragma once

#include "obstacle.hpp"

struct IndexedEdge
{
    Obstacle* m_obstacle;
    uint32_t m_index;
    IndexedEdge(Obstacle* obstacle, uint32_t index);
    bool operator==(const IndexedEdge& other) const;
    bool operator<(const IndexedEdge& other) const;
};
