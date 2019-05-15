#include "physics/collider.hpp"

#include <cmath>

#include "serial.hpp"

Collider::Collider(std::vector<Vector2D> points) : m_points(points) { }

void Collider::add(std::vector<Vector2D> points)
{
    m_points.insert(m_points.end(), points.begin(), points.end());
}

bool Collider::intersect(Edge edgeA, Edge edgeB, Vector2D* intersection, bool constrainToSegment)
{
    auto dirA = edgeA.m_second - edgeA.m_first;
    auto dirB = edgeB.m_second - edgeB.m_first;
    auto detDirADirB = determinant(dirA, dirB);
    if(std::abs(detDirADirB) == 0)
    {
        return false;
    }
    auto ratio = (determinant(dirB, edgeA.m_first) - determinant(dirB, edgeB.m_first)) / detDirADirB;
    if(constrainToSegment && (ratio < 0 || ratio > 1))
    {
        return false;
    }
    *intersection = edgeA.m_first + (dirA * ratio);
    return true;
}

bool Collider::contains(Vector2D point)
{
    // will contain result
    auto inside = false;
    // loop vars
    auto edgeCount = m_points.size();
    auto j = edgeCount - 1;
    // pre-allocate
    Vector2D first, second;

    for(auto i = 0; i < edgeCount; ++i)
    {
        first = m_points[i];
        second = m_points[j];
        if ((first.y > point.y) != (second.y > point.y) &&
            (point.x < 
                first.x + 
                (second.x - first.x) * 
                (point.y - first.y) / 
                (second.y - first.y)))
        {
            inside = !inside;
        }
        j = i;
    }

    return inside;
}

bool Collider::getEnteringEdge(Vector2D handlePosition, Vector2D objectPosition, Edge* enteringEdge)
{
    // will contain result
    auto minDist = 0.0;
    auto foundAny = false;
    // loop vars
    auto edgeCount = m_points.size();
    auto j = edgeCount - 1;
    // pre-allocate
    Vector2D first, second, intersection;
    bool intersects;
    double scale, dist;

    for(auto i = 0; i < edgeCount; ++i)
    {
        first = m_points[i];
        second = m_points[j];

        intersects = intersect(
            Edge(objectPosition, handlePosition), 
            Edge(first, second),
            &intersection);
        if(!intersects)
        {
            j = i;
            continue;
        }

        if(second.x - first.x == 0)
        {
            scale = (intersection.y - first.y) / (second.y - first.y);
        }
        else
        {
            scale = (intersection.x - first.x) / (second.x - first.x);
        }
        
        if(scale < 0 || scale > 1)
        {
            j = i;
            continue;
        }

        dist = (intersection - objectPosition).length();
        if(!foundAny || dist < minDist)
        {
            minDist = dist;
            *enteringEdge = Edge(first, second);
            foundAny = true;
        }
        
        j = i;
    }

    return foundAny;
}

Vector2D Collider::getClosestOutsidePoint(Edge edge, Vector2D handlePosition)
{
    auto dir = edge.m_first - edge.m_second;
    auto perpendicular = Vector2D(-dir.y, dir.x);

    Vector2D intersection;
    // don't care about return - perpendicular infinite lines always intersect
    intersect(
        edge, 
        Edge(handlePosition, handlePosition + perpendicular), 
        &intersection, 
        false);
    
    auto collisionVec = intersection - handlePosition;
    return handlePosition + collisionVec * 1.1;
}
