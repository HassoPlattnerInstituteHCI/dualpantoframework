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
    std::vector<uint32_t> getCellIndices(Edge edge);
public:
    Hashtable();
    void add(AnnotatedEdge* edge);
    void remove(AnnotatedEdge* edge);
    void getPossibleCollisions(Edge movement, std::set<IndexedEdge>* result);
    void print();
};
