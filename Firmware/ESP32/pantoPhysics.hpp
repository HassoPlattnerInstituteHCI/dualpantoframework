#pragma once

#include <vector>
#include "panto.hpp"
#include "utils.hpp"
#include "godObject.hpp"
#include "obstacle.hpp"

class PantoPhysics
{
private:
    Panto* m_panto;
    Vector2D m_currentPosition;
    GodObject m_godObject;
    std::vector<Obstacle> m_obstacles;
public:
    PantoPhysics(Panto* panto);
    void addObstacle(std::vector<Vector2D> points);
    void step();
};

extern std::vector<PantoPhysics> pantoPhysics;