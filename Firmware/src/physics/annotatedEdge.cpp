#include "physics/annotatedEdge.hpp"

#include "utils/serial.hpp"

#include "physics/edge.hpp"
#include "physics/indexedEdge.hpp"

// AnnotatedEdge::AnnotatedEdge(
//     Obstacle* obstacle, uint32_t index, const Edge& edge)
// : m_indexedEdge(new IndexedEdge(obstacle, index))
// , m_edge(new Edge(edge))
// {
// }

AnnotatedEdge::AnnotatedEdge(IndexedEdge* indexedEdge, Edge* edge)
: m_indexedEdge{indexedEdge}
, m_edge{edge}
{
}

AnnotatedEdge::AnnotatedEdge(const AnnotatedEdge& other)
: m_indexedEdge{other.m_indexedEdge}
, m_edge{other.m_edge}
{
}

void AnnotatedEdge::destroy()
{
    delete m_indexedEdge;
    delete m_edge;
    delete this;
}
