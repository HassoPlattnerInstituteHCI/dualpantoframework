#pragma once

#include "obstacle.hpp"

struct Collision
{
    Obstacle m_obstacle;
    Edge m_edge;
    Collision(Obstacle obstacle, Edge edge) : m_obstacle(obstacle), m_edge(edge) { };
};
