#pragma once

#include <tuple>

#include "physics/annotatedEdge.hpp"
#include "physics/obstacle.hpp"

union GodObjectActionData
{
    AnnotatedEdge* m_annotatedEdge;
    uint16_t m_obstacleId;
};
