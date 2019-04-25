#pragma once

#include <Arduino.h>

#include "branch.hpp"
#include "../indexedEdge.hpp"
#include "../edge.hpp"
#include "../obstacle.hpp"
#include "panto.hpp"
#include "utils.hpp"

class Quadtree
{
private:
    static std::pair<Vector2D, Vector2D> getRangeForPanto(Panto* panto);
    static std::pair<Vector2D, Vector2D> getRangeForMotor(uint8_t index);
    
    Branch* m_base;
public:
    Quadtree(Panto* panto);
    void add(Obstacle* obstacle, uint32_t index, Edge edge);
    void remove(Obstacle* obstacle, uint32_t index);
    std::vector<IndexedEdge> getCollisions(Edge movement);
};
