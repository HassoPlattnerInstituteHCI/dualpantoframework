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
        //uint16_t edge_id;
        IndexedEdge edge = IndexedEdge(nullptr, kNull);
    };

    static int32_t get1dIndex(double value, double min, double step);

    uint16_t m_cells[hashtableNumCells];
    CellEntry m_pool[MAX_MEMBERSHIPS]; 
    uint16_t m_free_head = kNull;

    void reset() {
        std::fill(std::begin(m_cells), std::end(m_cells), kNull);
        for (uint16_t i = 0; i < MAX_MEMBERSHIPS - 1; i++) {
            m_pool[i].next = i + 1;
        }
        m_pool[MAX_MEMBERSHIPS - 1].next = kNull; 
        m_free_head = 0;                           
    }

    uint16_t alloc_entry() {
        if (m_free_head == kNull) { 
            throw new std::runtime_error("All cell entries are in use");
        }
        int16_t i = m_free_head;
        m_free_head = m_pool[i].next;
        return i;
    }

    void free_entry(uint16_t idx) { 
        m_pool[idx].next = m_free_head;
        m_free_head = idx;
    }

    //void add_to_cell(uint16_t c, uint16_t edge_id) {
    void add_to_cell(uint16_t c, IndexedEdge edge) {
        uint16_t e = alloc_entry();
        //m_pool[e].edge_id = edge_id;
        m_pool[e].edge = edge;
        m_pool[e].next    = m_cells[c];
        m_cells[c]         = e;
    }

    //void remove_from_cell(uint16_t c, uint16_t edge_id) {
    void remove_from_cell(uint16_t c, IndexedEdge* edge) {
        uint16_t* p = &m_cells[c];
        while (*p != kNull) {
            uint16_t i = *p;
            //if (m_pool[i].edge_id == edge_id) {
            if (m_pool[i].edge == *edge) {
                *p = m_pool[i].next;
                free_entry(i);
                return;
            }
            p = &m_pool[i].next;
        }
    }


    std::vector<uint32_t> getCellIndices(Edge edge);
    std::set<uint32_t> expand(const std::vector<uint32_t>& edges);
public:
    Hashtable();
    void add(AnnotatedEdge* edge);
    void remove(AnnotatedEdge* edge);
    void getPossibleCollisions(Edge movement, std::set<IndexedEdge>* result);
    void print();
};
