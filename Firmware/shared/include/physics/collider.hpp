#pragma once

#include <vector>

#include "edge.hpp"
#include "utils.hpp"

class Collider
{
protected:
    std::vector<Vector2D> m_points;
public:
    Collider(std::vector<Vector2D> points);
    void add(std::vector<Vector2D> points);
    bool intersect(Edge edgeA, Edge edgeB, Vector2D* intersection, bool constrainToSegment = true);
    bool intersect(uint32_t edgeIndex, Edge edgeB, Vector2D* intersection, bool constrainToSegment = true);
    bool contains(Vector2D point);
    bool getEnteringEdge(Vector2D handlePosition, Vector2D objectPosition, uint32_t* enteringEdgeIndex);
    bool getEnteringEdge(Edge movement, std::vector<uint32_t> possibleEdges, uint32_t* enteringEdgeIndex);
    Vector2D getClosestOutsidePoint(
        uint32_t edgeIndex, Vector2D handlePosition);
    Edge getEdge(uint32_t index);
};
