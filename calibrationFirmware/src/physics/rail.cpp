#include "physics/rail.hpp"

Rail::Rail(std::vector<Vector2D> points, double displacement) : Obstacle(points, true)
{
    this->displacement = displacement;
}

bool Rail::contains(Vector2D point){
    //return true;
    // if the point is within the displacement around the rail then it is contained and the godobject collides
    double distLineToPoint = point.distancePointToLineSegment(m_points[0], m_points[1]);
    bool inside = (distLineToPoint < this->displacement);
    return inside;
}