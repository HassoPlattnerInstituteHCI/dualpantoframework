#pragma once

#include <tuple>

#include "physics/obstacle.hpp"

union GodObjectActionData
{
    const std::tuple<Obstacle*, uint32_t, Edge>& m_annotatedEdge;
    const uint16_t m_obstacleId;
};
