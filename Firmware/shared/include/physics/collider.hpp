#pragma once

#include <vector>

#include "edge.hpp"
#include "utils.hpp"

class Collider
{
private:
    std::vector<Vector2D> m_points;
public:
    Collider(std::vector<Vector2D> points);
    bool intersect(Edge edgeA, Edge edgeB, Vector2D* intersection, bool constrainToSegment = true);
    bool contains(Vector2D point);
    bool getEnteringEdge(Vector2D handlePosition, Vector2D objectPosition, Edge* enteringEdge);
    Vector2D getClosestOutsidePoint(Edge edge, Vector2D handlePosition);
    void move(Vector2D direction);
};
