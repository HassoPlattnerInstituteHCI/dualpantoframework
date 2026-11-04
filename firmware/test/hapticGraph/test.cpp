// Host test for the haptic graph logic, it doesn't need a device. Run from the firmware directory:
// g++ -std=c++11 -Iinclude -Itest/hapticGraph test/hapticGraph/test.cpp src/physics/hapticGraph.cpp src/utils/vector.cpp -o /tmp/hapticGraphTest && /tmp/hapticGraphTest

#include <cmath>
#include <cstdio>

#include "physics/hapticGraph.hpp"

static int failures = 0;

#define CHECK(condition)                                                 \
    if (!(condition))                                                    \
    {                                                                    \
        printf("FAILED %s:%d: %s\n", __FILE__, __LINE__, #condition);    \
        failures++;                                                      \
    }

static bool near(const Vector2D& a, const Vector2D& b, double tolerance = 0.001)
{
    return (a - b).length() < tolerance;
}

static void addNodes(HapticGraph& graph, std::vector<HapticGraph::NodeData> nodes)
{
    for (auto& node : nodes)
    {
        graph.addNode(node);
    }
}

// Walks from the entry to target in small steps, like a handle moving at physics rate.
static Vector2D moveTo(HapticGraph& graph, HapticGraph::Position& position, Vector2D from, Vector2D to)
{
    const auto steps = 1000;
    for (auto step = 1; step <= steps; ++step)
    {
        graph.walk(position, from + (to - from) * (static_cast<double>(step) / steps));
    }
    return HapticGraph::pointAt(position);
}

/*
Two parallel hallways that are only connected on the right, and a crossing on the top one:

        5
        |
    0---1---2
            |
    4-------3
*/
static HapticGraph makeMaze()
{
    HapticGraph graph(5, 3,20, 1, 0, 0);
    addNodes(graph, {{0, Vector2D(0, 0), true},
                     {1, Vector2D(50, 0), false},
                     {2, Vector2D(100, 0), false},
                     {3, Vector2D(100, -10), false},
                     {4, Vector2D(0, -10), true},
                     {5, Vector2D(50, 40), false}});
    CHECK(graph.addEdge(0, 1));
    CHECK(graph.addEdge(1, 2));
    CHECK(graph.addEdge(2, 3));
    CHECK(graph.addEdge(3, 4));
    CHECK(graph.addEdge(1, 5));
    return graph;
}

static HapticGraph::Position enterAtNode0(HapticGraph& graph)
{
    HapticGraph::Position position;
    CHECK(graph.findEntry(Vector2D(0, 0), position));
    return position;
}

static void testEntry()
{
    auto graph = makeMaze();
    HapticGraph::Position position;
    CHECK(!graph.findEntry(Vector2D(50, 0), position)); // on a node without entry flag
    CHECK(!graph.findEntry(Vector2D(-6, 0), position)); // out of the capture radius
    CHECK(graph.findEntry(Vector2D(-4, 0), position));
    CHECK(near(HapticGraph::pointAt(position), Vector2D(0, 0)));
    CHECK(graph.findEntry(Vector2D(1, -9), position)); // both entries in range: the closest one
    CHECK(near(HapticGraph::pointAt(position), Vector2D(0, -10)));

    HapticGraph unconnected(5, 3,20, 1, 0, 0);
    addNodes(unconnected, {{0, Vector2D(0, 0), true}});
    CHECK(!unconnected.findEntry(Vector2D(0, 0), position));
}

static void testNoSlackAcrossAndNoForceAlongTheWay()
{
    auto graph = makeMaze();
    auto position = enterAtNode0(graph);
    auto point = moveTo(graph, position, Vector2D(0, 0), Vector2D(20, 3));
    CHECK(near(point, Vector2D(20, 0)));
    // the error is purely across the way, even for a tiny offset
    auto error = point - Vector2D(20, 0.01);
    CHECK(near(error, Vector2D(0, -0.01), 0.000001));
}

static void testDoesNotJumpToNeighbouringHallway()
{
    auto graph = makeMaze();
    auto position = enterAtNode0(graph);
    // the handle ends right on the lower hallway, the god object has to stay on the upper one
    auto point = moveTo(graph, position, Vector2D(0, 0), Vector2D(30, -10));
    CHECK(near(point, Vector2D(30, 0)));
}

static void testDeadEndAndCorner()
{
    auto graph = makeMaze();
    auto position = enterAtNode0(graph);
    // dead end: stays at the node, the force pulls straight back
    auto point = moveTo(graph, position, Vector2D(0, 0), Vector2D(-10, 0));
    CHECK(near(point, Vector2D(0, 0)));

    // around the corner at node 2
    point = moveTo(graph, position, Vector2D(-10, 0), Vector2D(105, 0));
    CHECK(near(point, Vector2D(100, 0)));
    point = moveTo(graph, position, Vector2D(105, 0), Vector2D(101, -5));
    CHECK(near(point, Vector2D(100, -5)));
    // and into the lower hallway, which is reachable this way
    point = moveTo(graph, position, Vector2D(101, -5), Vector2D(100, -10));
    point = moveTo(graph, position, Vector2D(100, -10), Vector2D(30, -11));
    CHECK(near(point, Vector2D(30, -10)));
}

static void testCrossing()
{
    auto graph = makeMaze();
    auto position = enterAtNode0(graph);
    moveTo(graph, position, Vector2D(0, 0), Vector2D(50, 0));
    // straight on, then back and up the branch
    auto point = moveTo(graph, position, Vector2D(50, 0), Vector2D(70, 1));
    CHECK(near(point, Vector2D(70, 0)));
    moveTo(graph, position, Vector2D(70, 1), Vector2D(50, 0));
    point = moveTo(graph, position, Vector2D(50, 0), Vector2D(51, 20));
    CHECK(near(point, Vector2D(50, 20)));
}

static void testJunctionRadius()
{
    // passing the crossing with some offset doesn't turn into the branch
    auto straight = makeMaze();
    auto position = enterAtNode0(straight);
    auto point = moveTo(straight, position, Vector2D(0, 0.5), Vector2D(70, 0.5));
    CHECK(near(point, Vector2D(70, 0)));

    // overshooting the crossing by less than the radius can still turn up the branch
    auto overshoot = makeMaze();
    position = enterAtNode0(overshoot);
    moveTo(overshoot, position, Vector2D(0, 0), Vector2D(52, 0));
    point = moveTo(overshoot, position, Vector2D(52, 0), Vector2D(52, 20));
    CHECK(near(point, Vector2D(50, 20)));

    // too far past the crossing the god object is locked to the hallway
    auto tooFar = makeMaze();
    position = enterAtNode0(tooFar);
    moveTo(tooFar, position, Vector2D(0, 0), Vector2D(54, 0));
    point = moveTo(tooFar, position, Vector2D(54, 0), Vector2D(54, 15));
    CHECK(near(point, Vector2D(54, 0)));

    // without a radius there is no turning unless the node is hit exactly
    HapticGraph noRadius(5, 0, 20, 1, 0, 0);
    addNodes(noRadius, {{0, Vector2D(0, 0), true},
                        {1, Vector2D(50, 0), false},
                        {2, Vector2D(100, 0), false},
                        {3, Vector2D(50, 40), false}});
    CHECK(noRadius.addEdge(0, 1));
    CHECK(noRadius.addEdge(1, 2));
    CHECK(noRadius.addEdge(1, 3));
    position = enterAtNode0(noRadius);
    moveTo(noRadius, position, Vector2D(0, 0), Vector2D(52, 0));
    point = moveTo(noRadius, position, Vector2D(52, 0), Vector2D(52, 15));
    CHECK(near(point, Vector2D(52, 0)));

    // encoder noise at the switching point must not flip between the two ways
    auto noisy = makeMaze();
    position = enterAtNode0(noisy);
    moveTo(noisy, position, Vector2D(0, 0), Vector2D(52, 0));
    moveTo(noisy, position, Vector2D(52, 0), Vector2D(52, 2.2)); // just past the bisector and the hysteresis
    auto edge = position.edge;
    CHECK(edge->second->position == Vector2D(50, 40));
    for (auto frame = 0; frame < 100; ++frame)
    {
        noisy.walk(position, Vector2D(52, 2.2 + (frame % 2 == 0 ? 0.04 : -0.04)));
        CHECK(position.edge == edge);
    }
}

static void testFastHandleFinishesWalkOverMultipleFrames()
{
    HapticGraph graph(5, 3,0, 1, 0, 0);
    std::vector<HapticGraph::NodeData> nodes;
    for (uint16_t i = 0; i <= 20; ++i)
    {
        nodes.push_back({i, Vector2D(i * 10.0, 0), i == 0});
    }
    addNodes(graph, nodes);
    for (uint16_t i = 0; i < 20; ++i)
    {
        CHECK(graph.addEdge(i, i + 1));
    }
    auto position = enterAtNode0(graph);
    graph.walk(position, Vector2D(195, 0));
    CHECK(HapticGraph::pointAt(position).x < 195); // per-frame step limit
    for (auto frame = 0; frame < 5; ++frame)
    {
        graph.walk(position, Vector2D(195, 0));
    }
    CHECK(near(HapticGraph::pointAt(position), Vector2D(195, 0)));
}

static void testInvalidEdges()
{
    HapticGraph graph(5, 3,20, 1, 0, 0);
    addNodes(graph, {{0, Vector2D(0, 0), true}, {1, Vector2D(0, 0), false}});
    CHECK(!graph.addEdge(0, 9)); // unknown node
    CHECK(!graph.addEdge(0, 0)); // no length
    CHECK(!graph.addEdge(0, 1)); // no length
}

static void testBreakaway()
{
    HapticGraph graph(5, 3,20, 1, 0, 0);
    CHECK(!graph.isBreakingAway(Vector2D(0, 20)));
    CHECK(graph.isBreakingAway(Vector2D(0, 20.1)));

    HapticGraph disabled(5, 3,0, 1, 0, 0);
    CHECK(!disabled.isBreakingAway(Vector2D(0, 1000)));

    // can't be smaller than twice the capture radius
    HapticGraph tooSmall(5, 3,1, 1, 0, 0);
    CHECK(!tooSmall.isBreakingAway(Vector2D(0, 5)));
}

static void testForce()
{
    HapticGraph proportional(5, 3,20, 2, 0, 0);
    proportional.resetForce(Vector2D(1, 0));
    CHECK(near(proportional.computeForce(Vector2D(1, 0)), Vector2D(2, 0)));

    // a position update every 5th frame must not result in a derivative spike of the whole step
    HapticGraph derivative(5, 3,20, 0, 0, 1);
    derivative.resetForce(Vector2D(0, 0));
    auto first = derivative.computeForce(Vector2D(1, 0));
    CHECK(first.x > 0 && first.x < 0.5);
    for (auto frame = 0; frame < 100; ++frame)
    {
        derivative.computeForce(Vector2D(1, 0));
    }
    CHECK(near(derivative.computeForce(Vector2D(1, 0)), Vector2D(0, 0)));

    // the integral grows, but only up to its limit
    HapticGraph integral(5, 3,20, 0, 0.1, 0);
    integral.resetForce(Vector2D(1, 0));
    CHECK(near(integral.computeForce(Vector2D(1, 0)), Vector2D(0.1, 0)));
    for (auto frame = 0; frame < 100; ++frame)
    {
        integral.computeForce(Vector2D(1, 0));
    }
    CHECK(near(integral.computeForce(Vector2D(1, 0)), Vector2D(0.5, 0)));
    integral.resetForce(Vector2D(1, 0));
    CHECK(near(integral.computeForce(Vector2D(1, 0)), Vector2D(0.1, 0)));
}

int main()
{
    testEntry();
    testNoSlackAcrossAndNoForceAlongTheWay();
    testDoesNotJumpToNeighbouringHallway();
    testDeadEndAndCorner();
    testCrossing();
    testJunctionRadius();
    testFastHandleFinishesWalkOverMultipleFrames();
    testInvalidEdges();
    testBreakaway();
    testForce();

    if (failures == 0)
    {
        printf("All tests passed\n");
    }
    return failures == 0 ? 0 : 1;
}
