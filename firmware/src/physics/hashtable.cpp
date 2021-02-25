#include "physics/hashtable.hpp"

#include <Arduino.h>
#include <sstream>

#include "physics/edge.hpp"
#include "utils/assert.hpp"
#include "utils/serial.hpp"
#include "utils/utils.hpp"


int32_t Hashtable::get1dIndex(double value, double min, double step)
{
    return (int32_t)std::floor((value - min) / step);
}

std::vector<uint32_t> Hashtable::getCellIndices(Edge edge)
{
    std::vector<uint32_t> result;

    // http://www.cse.yorku.ca/~amana/research/grid.pdf
    const auto startX = edge.m_first.x;
    const auto startY = edge.m_first.y;
    const auto endX = edge.m_second.x;
    const auto endY = edge.m_second.y;
    auto x = get1dIndex(startX, rangeMinX, hashtableStepSizeX);
    auto y = get1dIndex(startY, rangeMinY, hashtableStepSizeY);
    const auto lastX = get1dIndex(endX, rangeMinX, hashtableStepSizeX);
    const auto lastY = get1dIndex(endY, rangeMinY, hashtableStepSizeY);
    const auto diffX = endX - startX;
    const auto diffY = endY - startY;
    const auto stepX = sgn(diffX);
    const auto stepY = sgn(diffY);
    const auto slopeX = diffY / diffX;
    const auto slopeY = diffX / diffY;
    auto nextX = stepX < 0
        ? (edge.m_first.x - (rangeMinX + x * hashtableStepSizeX))
        : ((rangeMinX + (x + 1) * hashtableStepSizeX) - edge.m_first.x);
    nextX = hypot(nextX, nextX * slopeX);
    auto nextY = stepY < 0
        ? (edge.m_first.y - (rangeMinY + y * hashtableStepSizeY))
        : ((rangeMinY + (y + 1) * hashtableStepSizeY) - edge.m_first.y);
    nextY = hypot(nextY, nextY * slopeY);
    const auto deltaX =
        hypot(hashtableStepSizeX, hashtableStepSizeX * slopeX);
    const auto deltaY =
        hypot(hashtableStepSizeY * slopeY, hashtableStepSizeY);

    while(x != lastX || y != lastY)
    {
        // ignore cells outside the physical range
        if(x >= 0 && x < hashtableStepsX && y >= 0 && y < hashtableStepsY)
        {
            result.push_back(x * hashtableStepsY + y);
        }

        if(nextX < nextY)
        {
            nextX += deltaX;
            x += stepX;
        }
        else
        {
            nextY += deltaY;
            y += stepY;
        }
    }

    // add end cell if inside range
    if(x >= 0 && x < hashtableStepsX && y >= 0 && y < hashtableStepsY)
    {
        result.push_back(x * hashtableStepsY + y);
    }

    return result;
}

std::set<uint32_t> Hashtable::expand(const std::vector<uint32_t>& edges)
{
    std::set<uint32_t> result;
    uint32_t x, y;
    for (const auto& edge : edges)
    {
        x = edge % hashtableStepsY;
        y = edge / hashtableStepsY;

        for(int32_t i = -1; i < 2; ++i)
        {
            if((x == 0 && i == -1) || (x == hashtableStepsX - 1 && i == 1))
            {
                continue;
            }

            for(int32_t j = -1; j < 2; ++j)
            {
                if((y == 0 && j == -1) || (y == hashtableStepsY - 1 && j == 1))
                {
                    continue;
                }

                result.insert((y + j) * hashtableStepsY + (x + i));
            }
        }
    }
    return result;
}

Hashtable::Hashtable()
{
    DPSerial::sendQueuedDebugLog(
        "Hashtable settings:");
    DPSerial::sendQueuedDebugLog(
        "Available memory of %i bytes can hold %i cells",
        hashtableMaxMemory,
        hashtableMaxCells);
    DPSerial::sendQueuedDebugLog(
        "Possible range of values is %3f by %3f mm",
        rangeMaxX - rangeMinX,
        rangeMaxY - rangeMinY);
    DPSerial::sendQueuedDebugLog(
        "Horizontal step size is %5.3f mm, resulting in %i steps",
        hashtableStepSizeX,
        hashtableStepsX);
    DPSerial::sendQueuedDebugLog(
        "Vertical step size is %5.3f mm, resulting in %i steps",
        hashtableStepSizeY,
        hashtableStepsY);
    DPSerial::sendQueuedDebugLog(
        "Resulting step count is %i, using %i bytes",
        hashtableNumCells,
        hashtableUsedMemory);
}

void Hashtable::add(AnnotatedEdge* edge)
{
    for(auto&& cellIndex : expand(getCellIndices(*(edge->m_edge))))
    {
        m_cells[cellIndex].emplace_back(
            edge->m_indexedEdge->m_obstacle, edge->m_indexedEdge->m_index);
    }
    edge->destroy();
}

void Hashtable::remove(AnnotatedEdge* edge)
{
    for(auto&& cellIndex : expand(getCellIndices(*(edge->m_edge))))
    {
        auto& cell = m_cells[cellIndex];
        auto it = std::find(
            cell.begin(), 
            cell.end(), 
            *(edge->m_indexedEdge));
        if(it != cell.end())
        {
            cell.erase(it);
            cell.shrink_to_fit();
        }
    }
    edge->destroy();
}

void Hashtable::getPossibleCollisions(
    Edge movement, std::set<IndexedEdge>* result)
{
    if(movement.m_first.x == 0 && movement.m_first.y == 0)
    {
        DPSerial::sendInstantDebugLog(
            "Skipping god object movement from zero position.");
        return;
    }
    const auto startX =
        get1dIndex(movement.m_first.x, rangeMinX, hashtableStepSizeX);
    const auto startY =
        get1dIndex(movement.m_first.y, rangeMinY, hashtableStepSizeY);
    const auto startIndex = startX * hashtableStepsY + startY;
    ASSERT_GE(startIndex, 0);

    ASSERT_LT(startIndex, hashtableNumCells);
    const auto endX =
        get1dIndex(movement.m_second.x, rangeMinX, hashtableStepSizeX);
    const auto endY =
        get1dIndex(movement.m_second.y, rangeMinY, hashtableStepSizeY);
    const auto endIndex = endX * hashtableStepsY + endY;
    ASSERT_GE(endIndex, 0);
    ASSERT_LT(endIndex, hashtableNumCells);
    auto dist = (uint8_t)(startX != endX) + (uint8_t)(startY != endY);
    const auto* begin = &m_cells[0];
    if(dist == 0)
    {
        const auto* cell = begin + startIndex;
        result->insert(cell->begin(), cell->end());
    }
    else if(dist == 1)
    {
        auto* cell = begin + startIndex;
        result->insert(cell->begin(), cell->end());
        cell = begin + endIndex;
        result->insert(cell->begin(), cell->end());
    }
    else
    {
        for(auto&& cellIndex : getCellIndices(movement))
        {
            const auto* cell = begin + cellIndex;
            result->insert(cell->begin(), cell->end());
        }
    }
}

void Hashtable::print()
{
    DPSerial::sendQueuedDebugLog("Printing hashtable...");
    std::ostringstream str;
    for(auto y = 0; y < hashtableStepsY; ++y)
    {
        for(auto x = 0; x < hashtableStepsX; x++)
        {
            str << (m_cells[x * hashtableStepsY + y].empty() ? '-' : '#');
        }
        DPSerial::sendQueuedDebugLog(str.str().c_str());
        str.str("");
    }
    DPSerial::sendQueuedDebugLog("Printing complete.");
}
