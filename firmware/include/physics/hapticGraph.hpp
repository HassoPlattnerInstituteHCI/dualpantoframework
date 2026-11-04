#pragma once

#include <cstdint>
#include <deque>
#include <map>
#include <utility>
#include <vector>

#include "utils/vector.hpp"

/*
A network of zero-width hallways ("digs"), made of nodes connected by ways (edges).

While the handle is on the graph the god object can only be on a way. Each frame it walks along
the ways to the point closest to the handle and a spring pulls the handle towards that point.
There is no free play across a way because the force starts at zero distance, and no force along
it because the closest point on a straight way is always exactly beside the handle.

The walk is local on purpose: it never leaves the connected path, so the god object can't jump
into a neighbouring hallway just because the handle got close to it.
*/
class HapticGraph
{
public:
    struct Edge;

    struct Node
    {
        Vector2D position;
        bool isEntry;
        std::vector<Edge*> edges;
    };

    struct Edge
    {
        Node* first;
        Node* second;
    };

    // location on the graph: ratio 0 is at edge->first, ratio 1 is at edge->second
    struct Position
    {
        Edge* edge = nullptr;
        double ratio = 0;
    };

    struct NodeData
    {
        uint16_t id;
        Vector2D position;
        bool isEntry;
    };

    HapticGraph(double captureRadius, double junctionRadius, double breakawayDistance, double p, double i, double d);

    // adding an existing id only updates that node's position and entry flag
    void addNode(const NodeData& data);
    // both nodes have to exist already; returns false if the edge can't be added
    bool addEdge(uint16_t firstId, uint16_t secondId);

    bool enabled() const;
    void enable(bool enable);

    // finds the closest entry node within the capture radius; returns false if there is none
    bool findEntry(const Vector2D& handle, Position& result) const;
    // moves position along the ways to the point closest to target
    void walk(Position& position, const Vector2D& target) const;
    static Vector2D pointAt(const Position& position);
    bool isBreakingAway(const Vector2D& error) const;

    // PID force towards the god object, with the same sign convention and gains as the walls
    Vector2D computeForce(const Vector2D& error);
    void resetForce(const Vector2D& error);

private:
    static const uint8_t c_maxWalkSteps = 8; // bounds the time spent per frame; the walk continues next frame
    static constexpr double c_walkEpsilon = 0.00001; // only switch ways for a real improvement, otherwise the god object could oscillate at a node
    static constexpr double c_junctionHysteresis = 0.1; // mm; keeps encoder noise from flipping between two ways of a junction
    // The encoder angle only updates every 5th physics frame (see Panto::readEncoders), so the raw
    // difference per frame is 4 zeros and a spike. Averaging keeps the unit of the wall's D gain (per frame).
    static constexpr double c_derivativeFilter = 0.2;
    static constexpr double c_integralLimit = 0.5; // force units; prevents wind-up while the user pushes against the way

    std::map<uint16_t, Node> m_nodes; // elements of a map and deque keep their address, so the pointers stay valid when adding
    std::deque<Edge> m_edges;
    bool m_enabled = false;

    double m_captureRadius;
    double m_junctionRadius;
    double m_breakawayDistance;

    double m_p;
    double m_i;
    double m_d;
    Vector2D m_lastError = Vector2D(0, 0);
    Vector2D m_filteredDerivative = Vector2D(0, 0);
    Vector2D m_integral = Vector2D(0, 0);

    static double closestRatio(const Edge& edge, const Vector2D& point);
    // moves position to a connected way that is closer to the target; returns false if there is none
    bool switchWay(Position& position, const Vector2D& target) const;
};
