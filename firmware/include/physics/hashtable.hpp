#pragma once

#include <set>
#include <vector>
#include <array>

#include "config/config.hpp"
#include "hardware/panto.hpp"
#include "physics/annotatedEdge.hpp"
#include "physics/indexedEdge.hpp"
#include "utils/serial.hpp"


class Hashtable
{
private:
    
    static constexpr int MAX_MEMBERSHIPS = 7000;
    static constexpr uint16_t kNull = 0xFFFF;

    struct CellEntry{
        uint16_t next = kNull;
        uint16_t edge_idx;
        //IndexedEdge edge = IndexedEdge(nullptr, kNull);
    };

    static int32_t get1dIndex(double value, double min, double step);

    uint16_t m_cells[hashtableNumCells];
    CellEntry m_pool[MAX_MEMBERSHIPS]; 
    uint16_t m_free_head = kNull;

    std::vector<IndexedEdge> m_edges;
    std::vector<uint16_t> m_edges_free;

    std::vector<uint32_t> getCellIndices(Edge edge);
    std::set<uint32_t> expand(const std::vector<uint32_t>& edges);

    // linked list utility functions
    uint16_t alloc_entry();
    void free_entry(uint16_t idx);
    void addToCell(uint16_t c, uint16_t edge_idx);
    void removeFromCell(uint16_t c, uint16_t edge_idx);
    int16_t lookupAndRemoveFromCell(uint16_t c, IndexedEdge* e);
public:
    Hashtable();
    void reset();
    uint16_t putIndexedEdge(IndexedEdge edge);
    void add(uint16_t edgeIdx);
    void remove(IndexedEdge* indexedEdge);
    void getPossibleCollisions(Edge movement, std::set<uint16_t>* result);
    void print();
    const IndexedEdge& getActiveIndexedEdge(uint16_t idx){ return m_edges[idx]; };
};
