#pragma once

#include <deque>
#include <set>
#include <tuple>
#include <vector>

#include "config.hpp"
#include "indexedEdge.hpp"
#include "panto.hpp"

class Hashtable
{
private:
    static constexpr double c_targetStepSize = 3;
    static const uint32_t c_stepsX =
        (uint32_t)((rangeMaxX - rangeMinX) / c_targetStepSize) + 1;
    static const uint32_t c_stepsY =
        (uint32_t)((rangeMaxY - rangeMinY) / c_targetStepSize) + 1;
    static constexpr double c_stepSizeX =
        (rangeMaxX - rangeMinX) / c_stepsX;
    static constexpr double c_stepSizeY =
        (rangeMaxY - rangeMinY) / c_stepsY;
    static const uint32_t c_processedEntriesPerFrame = 1;
    static int32_t get1dIndex(double value, double min, double step);

    std::vector<IndexedEdge> m_cells[c_stepsX * c_stepsY];
    std::deque<std::tuple<Obstacle*, uint32_t, Edge>> m_addQueue;
    std::deque<std::tuple<Obstacle*, uint32_t, Edge>> m_removeQueue;
    std::vector<uint32_t> getCellIndices(Edge edge);
    void add(Obstacle* obstacle, uint32_t index, Edge edge);
    void remove(Obstacle* obstacle, uint32_t index, Edge edge);
public:
    Hashtable();
    void add(
        const std::vector<std::tuple<Obstacle*, uint32_t, Edge>>& elements);
    void remove(
        const std::vector<std::tuple<Obstacle*, uint32_t, Edge>>& elements);
    void processQueues();
    void getPossibleCollisions(Edge movement, std::set<IndexedEdge>& result);
    void print();
};
