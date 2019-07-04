#pragma once

#include <tuple>

#include "physics/annotatedEdge.hpp"
#include "physics/obstacle.hpp"

union GodObjectActionData
{
    const AnnotatedEdge& m_annotatedEdge;
    const uint16_t m_obstacleId;
};
