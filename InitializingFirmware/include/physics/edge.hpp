#pragma once

#include "utils/vector.hpp"

struct Edge
{
    Vector2D m_first;
    Vector2D m_second;
    Edge(Vector2D first, Vector2D second) : m_first(first), m_second(second) {};
    Edge() : m_first(Vector2D()), m_second(Vector2D()) {};
};
