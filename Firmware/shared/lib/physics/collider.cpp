#include "physics/collider.hpp"

#include <cmath>
#include <numeric>

#include "serial.hpp"

Collider::Collider(std::vector<Vector2D> points) : m_points(points) { }

void Collider::add(std::vector<Vector2D> points)
{
    m_points.insert(m_points.end(), points.begin(), points.end());
}

// bool Collider::intersect(Edge edgeA, Edge edgeB, Vector2D* intersection, bool constrainToSegment)
// {
//     auto dirA = edgeA.m_second - edgeA.m_first;
//     auto dirB = edgeB.m_second - edgeB.m_first;
//     auto detDirADirB = determinant(dirA, dirB);
//     if(std::abs(detDirADirB) == 0)
//     {
//         return false;
//     }
//     auto ratio = (determinant(dirB, edgeA.m_first) - determinant(dirB, edgeB.m_first)) / detDirADirB;
//     if(constrainToSegment && (ratio < 0 || ratio > 1))
//     {
//         return false;
//     }
//     *intersection = edgeA.m_first + (dirA * ratio);
//     return true;
// }

// bool Collider::intersect(
//     uint32_t edgeIndex, 
//     Edge edgeB, 
//     Vector2D* intersection, 
//     bool constrainToSegment)
// {
//     return intersect(
//         getEdge(edgeIndex), edgeB, intersection, constrainToSegment);
// }

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

// bool Collider::getEnteringEdge(Vector2D handlePosition, Vector2D objectPosition, uint32_t* enteringEdgeIndex)
// {
//     std::vector<uint32_t> indices(m_points.size());
//     std::iota(indices.begin(), indices.end(), 0);

//     return getEnteringEdge(
//         Edge(objectPosition, handlePosition),
//         indices,
//         enteringEdgeIndex);
// }

// bool Collider::getEnteringEdge(
//     Edge movement,
//     std::vector<uint32_t> possibleEdges,
//     uint32_t* enteringEdgeIndex)
// {
//     // will contain result
//     auto minDist = 0.0;
//     auto foundAny = false;
//     // loop vars
//     auto possibleEdgeCount = possibleEdges.size();
//     // pre-allocate
//     uint32_t index;
//     Edge edge;
//     Vector2D intersection;
//     bool intersects;
//     double scale, dist;

//     for(auto i = 0; i < possibleEdgeCount; ++i)
//     {
//         index = possibleEdges[i];
//         edge = getEdge(index);

//         intersects = intersect(movement, edge, &intersection);
//         if(!intersects)
//         {
//             continue;
//         }

//         if(edge.m_second.x - edge.m_first.x == 0)
//         {
//             scale = 
//                 (intersection.y - edge.m_first.y) / 
//                 (edge.m_second.y - edge.m_first.y);
//         }
//         else
//         {
//             scale =
//                 (intersection.x - edge.m_first.x) /
//                 (edge.m_second.x - edge.m_first.x);
//         }
        
//         if(scale < 0 || scale > 1)
//         {
//             continue;
//         }

//         dist = (intersection - movement.m_first).length();
//         if(!foundAny || dist < minDist)
//         {
//             minDist = dist;
//             *enteringEdgeIndex = i;
//             foundAny = true;
//         }
//     }

//     return foundAny;
// }

// Vector2D Collider::getClosestOutsidePoint(
//     uint32_t edgeIndex, Vector2D handlePosition)
// {
//     auto edge = getEdge(edgeIndex);
//     auto dir = edge.m_first - edge.m_second;
//     auto perpendicular = Vector2D(-dir.y, dir.x);

//     Vector2D intersection;
//     // don't care about return - perpendicular infinite lines always intersect
//     intersect(
//         edge, 
//         Edge(handlePosition, handlePosition + perpendicular), 
//         &intersection, 
//         false);
    
//     auto collisionVec = intersection - handlePosition;
//     return handlePosition + collisionVec * 1.1;
// }

Edge Collider::getEdge(uint32_t index)
{
    return Edge(
        m_points[index % m_points.size()], 
        m_points[(index + 1) % m_points.size()]);
}
