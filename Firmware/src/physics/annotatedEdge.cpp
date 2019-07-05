#include "physics/annotatedEdge.hpp"

#include "utils/serial.hpp"

#include "physics/edge.hpp"
#include "physics/indexedEdge.hpp"

AnnotatedEdge::AnnotatedEdge(
    Obstacle* obstacle, uint32_t index, const Edge& edge)
: m_indexedEdge(new IndexedEdge(obstacle, index))
, m_edge(new Edge(edge))
{
}

void AnnotatedEdge::destroy()
{
    delete m_indexedEdge;
    delete m_edge;
}
