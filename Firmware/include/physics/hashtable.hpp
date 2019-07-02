#pragma once

#include <deque>
#include <set>
#include <tuple>
#include <vector>

#include "config/config.hpp"
#include "hardware/panto.hpp"
#include "physics/annotatedEdge.hpp"
#include "physics/indexedEdge.hpp"

class Hashtable
{
private:
    static int32_t get1dIndex(double value, double min, double step);

    std::vector<IndexedEdge> m_cells[hashtableNumCells];
    std::deque<AnnotatedEdge> m_addQueue;
    std::deque<AnnotatedEdge> m_removeQueue;
    std::vector<uint32_t> getCellIndices(Edge edge);
    void add(AnnotatedEdge edge);
    void remove(AnnotatedEdge edge);
public:
    Hashtable();
    void add(const std::vector<AnnotatedEdge>& elements);
    void remove(const std::vector<AnnotatedEdge>& elements);
    void processQueues();
    void getPossibleCollisions(Edge movement, std::set<IndexedEdge>* result);
    void print();
};
