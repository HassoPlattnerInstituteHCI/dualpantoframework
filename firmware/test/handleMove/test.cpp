// Host test for the handle move logic, it doesn't need a device. Run from the firmware directory:
// g++ -std=c++11 -Iinclude -Itest/hapticGraph test/handleMove/test.cpp src/hardware/handleMove.cpp src/utils/vector.cpp -o /tmp/handleMoveTest && /tmp/handleMoveTest

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <initializer_list>

#include "hardware/handleMove.hpp"

static int failures = 0;

#define CHECK(condition)                                                 \
    if (!(condition))                                                    \
    {                                                                    \
        printf("FAILED %s:%d: %s\n", __FILE__, __LINE__, #condition);    \
        failures++;                                                      \
    }

static const double c_dt = 0.001;
static const Vector2D c_start(0, -40);
static const Vector2D c_target(20, -70);
// long enough to finish the tween of a fast move from c_start to c_target, which is limited by the max speed
static const double c_tween = 0.7;

// A handle that follows the reference at limited speed, but doesn't move at all until the reference
// is further away than the friction, and ends up offset by the difference between the kinematics.
struct Handle
{
    Vector2D position = c_start;
    double friction = 0;
    Vector2D offset = Vector2D(0, 0);
    double maxSpeed = 100; // mm/s
    bool blocked = false;
    Vector2D rebound = Vector2D(0, 0); // how far it springs back once the motors let go
    bool released = false;

    void release()
    {
        if (!released)
        {
            position = position + rebound;
            released = true;
        }
    }

    void step(Vector2D reference)
    {
        released = false;
        if (blocked)
        {
            return;
        }
        const auto error = reference + offset - position;
        const auto distance = error.length();
        if (distance > friction)
        {
            const auto step = std::min(maxSpeed * c_dt, distance - friction);
            position = position + error * (step / distance);
        }
    }
};

struct Result
{
    HandleMove::Status status;
    double duration;
};

static Result run(HandleMove& move, Handle& handle, double limit = 60)
{
    auto time = 0.0;
    while (time < limit)
    {
        time += c_dt;
        const auto status = move.update(handle.position, c_dt);
        if (status != HandleMove::Running)
        {
            return {status, time};
        }
        if (move.resting())
        {
            handle.release();
        }
        else
        {
            handle.step(move.reference());
        }
    }
    return {HandleMove::Running, time};
}

static double distanceToTarget(const Handle& handle)
{
    return (c_target - handle.position).length();
}

static void testLandsWithoutDisturbance()
{
    HandleMove move;
    Handle handle;
    move.start(c_start, c_target, 1);
    CHECK(move.active());
    const auto result = run(move, handle);
    CHECK(result.status == HandleMove::Landed);
    CHECK(distanceToTarget(handle) <= 0.5);
    CHECK(result.duration >= 1); // not before the tween is over
    CHECK(result.duration < 2);
    CHECK(!move.active());
    CHECK(move.update(handle.position, c_dt) == HandleMove::Idle);
}

static void testFrictionIsCorrected()
{
    HandleMove move;
    Handle handle;
    handle.friction = 1.5;
    move.start(c_start, c_target, 1);
    const auto result = run(move, handle);
    CHECK(result.status == HandleMove::Landed);
    CHECK(distanceToTarget(handle) <= 0.5);
}

static void testKinematicsOffsetIsCorrected()
{
    HandleMove move;
    Handle handle;
    handle.offset = Vector2D(-3, 3);
    move.start(c_start, c_target, 1);
    const auto result = run(move, handle);
    CHECK(result.status == HandleMove::Landed);
    CHECK(distanceToTarget(handle) <= 0.5);
}

static void testSlowHandleStillLands()
{
    HandleMove move;
    Handle handle;
    handle.maxSpeed = 20; // needs longer than the tween
    move.start(c_start, c_target, 1);
    const auto result = run(move, handle);
    CHECK(result.status == HandleMove::Landed);
    CHECK(result.duration > 1.5);
    CHECK(distanceToTarget(handle) <= 0.5);
}

static void testPassingThroughTheTargetIsNotLanding()
{
    HandleMove move;
    Handle handle;
    handle.position = c_target;
    move.start(c_target, Vector2D(c_target.x, c_target.y - 1), 1000);
    CHECK(move.update(handle.position, 0.001) == HandleMove::Running); // finishes the tween
    // within the tolerance, but not for long enough
    CHECK(move.update(Vector2D(c_target.x, c_target.y - 1), 0.05) == HandleMove::Running);
    CHECK(move.update(Vector2D(c_target.x + 5, c_target.y), 0.001) == HandleMove::Running);
    CHECK(move.update(Vector2D(c_target.x, c_target.y - 1), 0.05) == HandleMove::Running);
    CHECK(move.update(Vector2D(c_target.x, c_target.y - 1), 0.06) == HandleMove::Running);
    CHECK(move.resting());
    CHECK(move.update(Vector2D(c_target.x, c_target.y - 1), 0.3) == HandleMove::Landed);
}

static void testMovingHandleDoesNotLand()
{
    HandleMove move;
    move.start(c_start, c_target, 1000);
    move.update(c_start, c_tween); // finishes the tween
    // crawls through the whole tolerance, 0.8 mm in 0.2 s
    auto position = Vector2D(c_target.x, c_target.y + 0.4);
    for (auto frame = 0; frame < 200; ++frame)
    {
        position = Vector2D(position.x, position.y - 0.004);
        CHECK(move.update(position, c_dt) == HandleMove::Running);
        CHECK(!move.resting());
    }

    // jitter below the limit is still
    HandleMove jitter;
    jitter.start(c_start, c_target, 1000);
    jitter.update(c_start, c_tween);
    for (auto frame = 0; frame < 110; ++frame)
    {
        jitter.update(Vector2D(c_target.x, c_target.y + (frame % 2 ? 0.1 : 0)), c_dt);
    }
    CHECK(jitter.resting());

    // neither is noise around the edge of the tolerance
    HandleMove edge;
    edge.start(c_start, c_target, 1000);
    edge.update(c_start, c_tween);
    for (auto frame = 0; frame < 110; ++frame)
    {
        edge.update(Vector2D(c_target.x, c_target.y + (frame % 2 ? 0.55 : 0.45)), c_dt);
    }
    CHECK(edge.resting());

    // but leaving it for real does
    HandleMove left;
    left.start(c_start, c_target, 1000);
    left.update(c_start, c_tween);
    for (auto frame = 0; frame < 110; ++frame)
    {
        left.update(Vector2D(c_target.x, c_target.y + (frame % 2 ? 0.7 : 0.45)), c_dt);
    }
    CHECK(!left.resting());
}

static void testNoJumpAfterRest()
{
    HandleMove move;
    move.start(c_start, c_target, 1000);
    move.update(c_start, c_tween);
    move.update(c_target, 0.11);
    CHECK(move.resting());

    // it coasted 6 mm after the release: no rebound, so no compensation either
    const Vector2D coasted(c_target.x, c_target.y + 6);
    move.update(coasted, 0.3);
    CHECK(!move.resting());
    CHECK((move.reference() - coasted).length() < 0.000001);
    auto previous = move.reference();
    for (auto frame = 0; frame < 600; ++frame) // 6 mm at a mean of 20 / 1.875 mm/s
    {
        move.update(coasted, c_dt);
        CHECK((move.reference() - previous).length() < 0.021); // 20 mm/s at the peak
        previous = move.reference();
    }
    CHECK((move.reference() - c_target).length() < 0.000001);

    // a rebound is compensated, also without a jump
    HandleMove rebound;
    rebound.start(c_start, c_target, 1000);
    rebound.update(c_start, c_tween);
    rebound.update(c_target, 0.11);
    const Vector2D sprung(c_target.x, c_target.y + 1);
    rebound.update(sprung, 0.3);
    CHECK((rebound.reference() - sprung).length() < 0.000001);
    for (auto frame = 0; frame < 250; ++frame) // 2 mm at a mean of 20 / 1.875 mm/s
    {
        rebound.update(sprung, c_dt);
    }
    CHECK((rebound.reference() - Vector2D(c_target.x, c_target.y - 1)).length() < 0.000001);
}

static void testBlockedHandleTimesOut()
{
    HandleMove move;
    Handle handle;
    handle.blocked = true;
    move.start(c_start, c_target, 1);
    const auto result = run(move, handle);
    CHECK(result.status == HandleMove::TimedOut);
    CHECK(result.duration > 3.9 && result.duration < 4.1); // 1 s tween, 3 s to settle
    CHECK(!move.active());
}

static void testRunawayIsStopped()
{
    // off to the side of the path
    HandleMove sideways;
    sideways.start(c_start, c_target, 1);
    CHECK(sideways.update(Vector2D(c_start.x - 9, c_start.y), c_dt) == HandleMove::Running);
    CHECK(sideways.update(Vector2D(c_start.x - 11, c_start.y), c_dt) == HandleMove::Deviated);
    CHECK(!sideways.active());

    // past the target
    HandleMove past;
    past.start(Vector2D(0, -28), Vector2D(0, -45), 1000);
    CHECK(past.update(Vector2D(0, -28), c_tween) == HandleMove::Running);
    CHECK(past.update(Vector2D(0, -54), c_dt) == HandleMove::Running);
    CHECK(past.update(Vector2D(0, -56), c_dt) == HandleMove::Deviated);

    // also while resting
    HandleMove resting;
    resting.start(c_start, c_target, 1000);
    resting.update(c_target, c_tween);
    resting.update(c_target, 0.11);
    CHECK(resting.resting());
    CHECK(resting.update(Vector2D(c_target.x, c_target.y - 11), c_dt) == HandleMove::Deviated);
    CHECK(!resting.resting());

    // a move without any distance has a path too
    HandleMove inPlace;
    inPlace.start(c_target, c_target, 1);
    CHECK(inPlace.update(Vector2D(c_target.x, c_target.y - 11), c_dt) == HandleMove::Deviated);

    // being stuck far behind the reference is fine as long as it is on the path
    HandleMove stuck;
    stuck.start(c_start, c_target, 1000);
    CHECK(stuck.update(c_start, c_tween) == HandleMove::Running);
    CHECK(stuck.update(c_start, c_dt) == HandleMove::Running);
}

static void testNoCorrectionForLargeErrors()
{
    HandleMove move;
    Handle handle;
    handle.blocked = true; // 36 mm behind the target when the tween ends
    move.start(c_start, c_target, 1);
    while (run(move, handle, c_dt).status == HandleMove::Running)
    {
        CHECK((move.reference() - c_target).length() < 37);
    }
    move.start(c_start, c_target, 1000);
    CHECK(move.update(c_start, c_tween) == HandleMove::Running);
    for (auto frame = 0; frame < 1000; ++frame)
    {
        move.update(c_start, c_dt);
        CHECK((move.reference() - c_target).length() < 0.000001);
    }

    // starts correcting once it is close, and forgets about it if it gets far away again
    const Vector2D close(c_target.x, c_target.y + 3);
    for (auto frame = 0; frame < 500; ++frame)
    {
        move.update(close, c_dt);
    }
    CHECK((move.reference() - c_target).length() > 3);
    move.update(Vector2D(c_target.x, c_target.y + 6), c_dt);
    CHECK((move.reference() - c_target).length() < 0.000001);
}

static void testReboundIsCompensated()
{
    HandleMove move;
    Handle handle;
    handle.rebound = Vector2D(0.3, 1); // ends up outside of the tolerance after the first try
    move.start(c_start, c_target, 1);
    const auto result = run(move, handle);
    CHECK(result.status == HandleMove::Landed);
    CHECK(distanceToTarget(handle) <= 0.5);
    CHECK(result.duration > 1.5);

    // a rebound small enough to stay within the tolerance needs only one try
    HandleMove small;
    Handle smallHandle;
    smallHandle.rebound = Vector2D(0, 0.2);
    small.start(c_start, c_target, 1);
    CHECK(run(small, smallHandle).status == HandleMove::Landed);
    CHECK(distanceToTarget(smallHandle) <= 0.5);

    // the far positions spring back further
    HandleMove large;
    Handle largeHandle;
    largeHandle.rebound = Vector2D(0, 3);
    large.start(c_start, c_target, 1);
    CHECK(run(large, largeHandle).status == HandleMove::Landed);
    CHECK(distanceToTarget(largeHandle) <= 0.5);
}

static void testCorrectionIsLimited()
{
    HandleMove move;
    Handle handle;
    handle.blocked = true;
    handle.position = Vector2D(c_target.x, c_target.y + 3);
    move.start(c_start, c_target, 1);
    auto largest = 0.0;
    auto time = 0.0;
    while (run(move, handle, c_dt).status == HandleMove::Running)
    {
        time += c_dt;
        if (time > 1.01) // the tween is over
        {
            largest = std::max(largest, (move.reference() - c_target).length());
        }
    }
    CHECK(largest > 3);
    CHECK(largest <= 5.000001);
}

static void testInvalidSpeedTimesOut()
{
    for (const auto speed : {0.0, -1.0, 0.0001, static_cast<double>(NAN)})
    {
        HandleMove move;
        Handle handle;
        move.start(c_start, c_target, speed);
        const auto result = run(move, handle);
        CHECK(result.status == HandleMove::TimedOut);
        CHECK(result.duration < 34);
        CHECK(!std::isnan(move.reference().x));
    }
}

static void testInvalidPositions()
{
    HandleMove move;
    move.start(c_start, c_target, 1000);
    const Vector2D invalid(NAN, NAN);
    CHECK(move.update(c_start, c_tween) == HandleMove::Running); // finishes the tween
    for (auto frame = 0; frame < 1000; ++frame)
    {
        CHECK(move.update(invalid, c_dt) == HandleMove::Running);
        CHECK(!std::isnan(move.reference().x));
    }
    // doesn't land on invalid values, and neither does it time out any later
    auto time = c_tween + 1.0;
    while (move.update(invalid, c_dt) == HandleMove::Running)
    {
        time += c_dt;
        CHECK(time < 3.8); // the tween takes 0.675 s, then 3 s to settle
    }
    CHECK(!move.active());

    // valid values again: landing works, the NaN didn't stick
    HandleMove recovering;
    recovering.start(c_start, c_target, 1000);
    recovering.update(c_start, c_tween);
    recovering.update(invalid, c_dt);
    recovering.update(c_target, 0.11);
    CHECK(recovering.resting());
    CHECK(recovering.update(c_target, 0.3) == HandleMove::Landed);
}

static void testCancelAndRestart()
{
    HandleMove move;
    Handle handle;
    handle.blocked = true;
    move.start(c_start, c_target, 1);
    run(move, handle, 3.5);
    CHECK(move.active());
    move.cancel();
    CHECK(!move.active());
    CHECK(move.update(handle.position, c_dt) == HandleMove::Idle);

    // a new move gets a new time limit and no correction from the old one
    handle.blocked = false;
    move.start(handle.position, c_target, 1);
    CHECK((move.reference() - handle.position).length() == 0);
    CHECK(run(move, handle).status == HandleMove::Landed);
}

static void testTweenIsSmoothAndLimited()
{
    // a long move at the default speed would take 1 s, the max speed makes it longer
    const Vector2D far(c_start.x + 120, c_start.y);
    HandleMove move;
    move.start(c_start, far, 1);
    auto previous = move.reference();
    auto largestStep = 0.0;
    auto firstStep = -1.0;
    auto time = 0.0;
    while ((move.reference() - far).length() > 0.000001)
    {
        move.update(move.reference(), c_dt);
        time += c_dt;
        const auto step = (move.reference() - previous).length();
        if (firstStep < 0)
        {
            firstStep = step;
        }
        largestStep = std::max(largestStep, step);
        previous = move.reference();
    }
    CHECK(time > 2.2 && time < 2.3); // 120 mm * 1.875 / 100 mm/s
    CHECK(largestStep <= 100 * c_dt * 1.0001); // the peak speed
    CHECK(firstStep < 0.001); // starts without a jump of the speed

    // a short one still takes 1 / speed
    HandleMove shortMove;
    shortMove.start(c_start, Vector2D(c_start.x + 10, c_start.y), 1);
    time = 0;
    while ((shortMove.reference() - Vector2D(c_start.x + 10, c_start.y)).length() > 0.000001)
    {
        shortMove.update(shortMove.reference(), c_dt);
        time += c_dt;
    }
    CHECK(time > 0.99 && time < 1.01);
}

int main()
{
    testLandsWithoutDisturbance();
    testFrictionIsCorrected();
    testKinematicsOffsetIsCorrected();
    testSlowHandleStillLands();
    testPassingThroughTheTargetIsNotLanding();
    testMovingHandleDoesNotLand();
    testNoJumpAfterRest();
    testBlockedHandleTimesOut();
    testRunawayIsStopped();
    testNoCorrectionForLargeErrors();
    testReboundIsCompensated();
    testCorrectionIsLimited();
    testInvalidSpeedTimesOut();
    testInvalidPositions();
    testCancelAndRestart();
    testTweenIsSmoothAndLimited();

    if (failures == 0)
    {
        printf("All tests passed\n");
    }
    return failures == 0 ? 0 : 1;
}
