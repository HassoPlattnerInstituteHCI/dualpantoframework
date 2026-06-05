#pragma once

#include <utility>

struct Edge;
struct IndexedEdge;
class Obstacle;

struct AnnotatedEdge
{
    IndexedEdge* m_indexedEdge;
    Edge* m_edge;
    AnnotatedEdge(IndexedEdge* indexedEdge, Edge* edge);
    AnnotatedEdge(const AnnotatedEdge& other);
    void destroy();
};
