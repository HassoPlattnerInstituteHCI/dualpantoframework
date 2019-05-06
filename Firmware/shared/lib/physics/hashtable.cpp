#include "physics/hashtable.hpp"

#include <sstream>

#include "serial.hpp"
#include "utils.hpp"

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
    auto x = get1dIndex(startX, rangeMinX, c_stepSizeX);
    auto y = get1dIndex(startY, rangeMinY, c_stepSizeY);
    const auto lastX = get1dIndex(endX, rangeMinX, c_stepSizeX);
    const auto lastY = get1dIndex(endY, rangeMinY, c_stepSizeY);
    const auto diffX = endX - startX;
    const auto diffY = endY - startY;
    const auto stepX = sgn(diffX);
    const auto stepY = sgn(diffY);
    const auto slopeX = diffY / diffX;
    const auto slopeY = diffX / diffY;
    auto nextX = stepX < 0
        ? (edge.m_first.x - (rangeMinX + x * c_stepSizeX))
        : ((rangeMinX + (x + 1) * c_stepSizeX) - edge.m_first.x);
    nextX = hypot(nextX, nextX * slopeX);
    auto nextY = stepY < 0
        ? (edge.m_first.y - (rangeMinY + y * c_stepSizeY))
        : ((rangeMinY + (y + 1) * c_stepSizeY) - edge.m_first.y);
    nextY = hypot(nextY, nextY * slopeY);
    const auto deltaX = hypot(c_stepSizeX, c_stepSizeX * slopeX);
    const auto deltaY = hypot(c_stepSizeY * slopeY, c_stepSizeY);

    // DPSerial::sendInstantDebugLog("edge %+08.3f|%+08.3f %+08.3f|%+08.3f beg/end %i %i %i %i step %i %i %+08.3f %+08.3f next %+08.3f %+08.3f", edge.m_first.x, edge.m_first.y, edge.m_second.x, edge.m_second.y, x, y, lastX, lastY, stepX, stepY, c_stepSizeX, c_stepSizeY, nextX, nextY);

    //DPSerial::sendInstantDebugLog("start loop");
    while(x != lastX || y != lastY)
    {
        // ignore cells outside the physical range
        if(x >= 0 && x < c_stepsX && y >= 0 && y < c_stepsY)
        {
            result.push_back(x * c_stepsY + y);
        }
        //DPSerial::sendInstantDebugLog("edge %+08.3f|%+08.3f %+08.3f|%+08.3f beg/end %i %i %i %i step %i %i %+08.3f %+08.3f next %+08.3f %+08.3f", edge.m_first.x, edge.m_first.y, edge.m_second.x, edge.m_second.y, x, y, lastX, lastY, stepX, stepY, c_stepSizeX, c_stepSizeY, nextX, nextY);

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
    if(x >= 0 && x < c_stepsX && y >= 0 && y < c_stepsY)
    {
        result.push_back(x * c_stepsY + y);
    }

    return result;
}

void Hashtable::add(Obstacle* obstacle, uint32_t index, Edge edge)
{
    //DPSerial::sendQueuedDebugLog("adding %+08.3f|%+08.3f %+08.3f|%+08.3f to...", edge.m_first.x, edge.m_first.y, edge.m_second.x, edge.m_second.y);
    for(auto&& cellIndex : getCellIndices(edge))
    {
        //DPSerial::sendQueuedDebugLog("cell %i", cellIndex);
        m_cells[cellIndex].emplace_back(obstacle, index);
    }
}

void Hashtable::remove(Obstacle* obstacle, uint32_t index, Edge edge)
{
    for(auto&& cellIndex : getCellIndices(edge))
    {
        auto& cell = m_cells[cellIndex];
        auto it = std::find(
            cell.begin(), 
            cell.end(), 
            IndexedEdge{obstacle, index});
        if(it != cell.end())
        {
            cell.erase(it);
        }
    }
}

Hashtable::Hashtable()
{
    DPSerial::sendQueuedDebugLog("Hashtable settings:");
    DPSerial::sendQueuedDebugLog("Target step size: %+08.3f", c_targetStepSize);
    DPSerial::sendQueuedDebugLog("Steps (x): %i", c_stepsX);
    DPSerial::sendQueuedDebugLog("Steps (y): %i", c_stepsY);
    DPSerial::sendQueuedDebugLog("Actual step size (x): %+08.3f", c_stepSizeX);
    DPSerial::sendQueuedDebugLog("Actual step size (y): %+08.3f", c_stepSizeY);
}

void Hashtable::add(
    const std::vector<std::tuple<Obstacle*, uint32_t, Edge>>& elements)
{
    m_addQueue.insert(m_addQueue.end(), elements.begin(), elements.end());
}

void Hashtable::remove(
    const std::vector<std::tuple<Obstacle*, uint32_t, Edge>>& elements)
{
    m_removeQueue.insert(m_removeQueue.end(), elements.begin(), elements.end());
}

void Hashtable::processQueues()
{
    // quick check to avoid loop if not necessary
    if(m_addQueue.empty() && m_removeQueue.empty())
    {
        return;
    }

    for(auto i = 0; i < c_processedEntriesPerFrame; ++i)
    {
        if(!m_addQueue.empty())
        {
            auto edge = m_addQueue.front();
            m_addQueue.pop_front();
            add(std::get<0>(edge), std::get<1>(edge), std::get<2>(edge));
        }
        if(!m_removeQueue.empty())
        {
            auto edge = m_removeQueue.front();
            m_removeQueue.pop_front();
            remove(std::get<0>(edge), std::get<1>(edge), std::get<2>(edge));
        }
    }
}

std::set<IndexedEdge> Hashtable::getPossibleCollisions(Edge movement)
{
    std::set<IndexedEdge> result;
    if(movement.m_first.x == 0 && movement.m_first.x == 0)
    {
        DPSerial::sendInstantDebugLog("Skipping god object movement from zero position.");
        return result;
    }
    auto startX = get1dIndex(movement.m_first.x, rangeMinX, c_stepSizeX);
    auto startY = get1dIndex(movement.m_first.y, rangeMinY, c_stepSizeY);
    auto endX = get1dIndex(movement.m_second.x, rangeMinX, c_stepSizeX);
    auto endY = get1dIndex(movement.m_second.y, rangeMinY, c_stepSizeY);
    auto dist = (uint8_t)(startX != endX) + (uint8_t)(startY != endY);
    if(dist == 0)
    {
        auto cell = m_cells[startX * c_stepsY + startY];
        result.insert(cell.begin(), cell.end());
    }
    else if(dist == 1)
    {
        auto cell = m_cells[startX * c_stepsY + startY];
        result.insert(cell.begin(), cell.end());
        cell = m_cells[endX * c_stepsY + endY];
        result.insert(cell.begin(), cell.end());
    }
    else
    {
        for(auto&& cellIndex : getCellIndices(movement))
        {
            auto cell = m_cells[cellIndex];
            result.insert(cell.begin(), cell.end());
        }
    }
    return result;
}

void Hashtable::print()
{
    DPSerial::sendQueuedDebugLog("Printing hashtable...");
    std::ostringstream str;
    for(auto y = 0; y < c_stepsY; ++y)
    {
        for(auto x = 0; x < c_stepsX; x++)
        {
            str << (m_cells[x * c_stepsY + y].empty() ? '-' : '#');
        }
        DPSerial::sendQueuedDebugLog(str.str().c_str());
        str.str("");
    }
    DPSerial::sendQueuedDebugLog("Printing complete.");
}
