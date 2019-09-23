#pragma once

#include "physics/annotatedEdge.hpp"
#include "physics/godObjectActionData.hpp"
#include "physics/godObjectActionType.hpp"

struct GodObjectAction
{
    GodObjectActionType m_type;
    GodObjectActionData m_data;
    GodObjectAction(
        GodObjectActionType type,
        AnnotatedEdge* data)
        : m_type(type)
        , m_data{.m_annotatedEdge = data} { };
    GodObjectAction(
        GodObjectActionType type,
        uint16_t data)
        : m_type(type)
        // Intellisense might show an error here, but that's a bug.
        // https://github.com/Microsoft/vscode-cpptools/issues/3491
        , m_data{.m_obstacleId = data} { };
};
