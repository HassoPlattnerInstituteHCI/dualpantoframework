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
    static int32_t get1dIndex(double value, double min, double step);

    std::vector<IndexedEdge> m_cells[hashtableNumCells];
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
    void getPossibleCollisions(Edge movement, std::set<IndexedEdge>* result);
    void print();
};
