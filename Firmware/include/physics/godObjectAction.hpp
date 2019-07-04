#pragma once

#include "physics/annotatedEdge.hpp"
#include "physics/godObjectActionData.hpp"
#include "physics/godObjectActionType.hpp"

struct GodObjectAction
{
    const GodObjectActionType m_type;
    const GodObjectActionData m_data;
    GodObjectAction(
        const GodObjectActionType type,
        const AnnotatedEdge& data)
        : m_type(type)
        , m_data{.m_annotatedEdge = {data}} { };
    GodObjectAction(
        const GodObjectActionType type,
        const uint16_t data)
        : m_type(type)
        // Intellisense might show an error here, but that's a bug.
        // https://github.com/Microsoft/vscode-cpptools/issues/3491
        , m_data{.m_obstacleId = data} { };
};
