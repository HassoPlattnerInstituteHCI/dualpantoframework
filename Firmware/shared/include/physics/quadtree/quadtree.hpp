#pragma once

#include <Arduino.h>
#include <deque>
#include <string>

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
    std::deque<std::tuple<Obstacle*, uint32_t, Edge>> m_addQueue;
    std::deque<std::tuple<Obstacle*, uint32_t, Edge>> m_removeQueue;
    void add(Obstacle* obstacle, uint32_t index, Edge edge);
    void remove(Obstacle* obstacle, uint32_t index);
public:
    Quadtree(Panto* panto);
    void add(
        const std::vector<std::tuple<Obstacle*, uint32_t, Edge>>& elements);
    void remove(
        const std::vector<std::tuple<Obstacle*, uint32_t, Edge>>& elements);
    void processQueues();
    std::vector<IndexedEdge> getCollisions(Edge movement);
    void print();
};
