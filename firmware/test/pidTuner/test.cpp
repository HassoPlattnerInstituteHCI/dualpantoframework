// Host test for the PID tuning logic, it doesn't need a device. Run from the firmware directory:
// g++ -std=c++11 -Iinclude -Itest/hapticGraph test/pidTuner/test.cpp src/hardware/pidTuner.cpp src/hardware/handleMove.cpp src/utils/vector.cpp -o /tmp/pidTunerTest && /tmp/pidTunerTest

#include <cmath>
#include <cstdio>

#include "hardware/pidTuner.hpp"

static int failures = 0;

#define CHECK(condition)                                                 \
    if (!(condition))                                                    \
    {                                                                    \
        printf("FAILED %s:%d: %s\n", __FILE__, __LINE__, #condition);    \
        failures++;                                                      \
    }

static const double c_dt = 0.001;
static const Vector2D c_center(0, -100);
static const double c_amplitude = 25;

// A handle with mass, viscous and Coulomb friction, driven by a saturating PD controller on the reference like the
// firmware's. The encoders only update every 5th frame and the derivative is filtered, so too much P or D shakes it.
// The gains are scaled so that the best ones are around P = 6, D = 2000, roughly where the real device is.
struct Plant
{
    Vector2D position = Vector2D(10, -50);
    Vector2D velocity = Vector2D(0, 0);
    Vector2D measured = position;
    Vector2D previousError = Vector2D(0, 0);
    Vector2D derivative = Vector2D(0, 0);
    bool engaged = false;
    int frame = 0;
    double friction = 150; // mm/s^2

    void step(bool drive, Vector2D reference, PidTuner::Gains gains)
    {
        if (++frame % 5 == 0)
        {
            measured = position;
        }
        auto acceleration = velocity * -2;
        if (drive)
        {
            const auto error = reference - measured;
            const auto previous = engaged ? previousError : error;
            derivative = derivative + ((error - previous) * (1 / c_dt) - derivative) * 0.2;
            previousError = error;
            engaged = true;
            auto power = error * (gains.p * 0.01) + derivative * (gains.d * 2e-6);
            if (power.length() > 0.2)
            {
                power = power * (0.2 / power.length());
            }
            acceleration = acceleration + power * 15000;
        }
        else
        {
            engaged = false;
            derivative = Vector2D(0, 0);
        }
        const auto speed = velocity.length();
        if (speed > 0)
        {
            acceleration = acceleration - velocity * (friction / speed);
        }
        else if (acceleration.length() <= friction)
        {
            acceleration = Vector2D(0, 0);
        }
        const auto newVelocity = velocity + acceleration * c_dt;
        // friction stops it instead of turning it around
        velocity = newVelocity * velocity < 0 && !drive ? Vector2D(0, 0) : newVelocity;
        position = position + velocity * c_dt;
    }
};

struct Run
{
    PidTuner::Status status;
    double duration;
    int moves;
};

static Run tune(PidTuner& tuner, Plant& plant, double limit = 1200)
{
    HandleMove move;
    PidTuner::Gains gains = tuner.gains();
    Run result = {PidTuner::Running, 0, 0};
    while (tuner.active() && result.duration < limit)
    {
        result.duration += c_dt;
        if (!move.active())
        {
            Vector2D target;
            double speed;
            if (!tuner.nextMove(plant.measured, target, speed))
            {
                break;
            }
            move.start(plant.measured, target, speed);
            gains = tuner.gains();
            result.moves++;
        }
        const auto status = move.update(plant.measured, c_dt);
        if (status != HandleMove::Running)
        {
            tuner.moveEnded(status);
            plant.step(false, plant.measured, gains);
            continue;
        }
        if (!tuner.sample(plant.measured, move.reference(), c_dt))
        {
            move.cancel();
            tuner.moveEnded(HandleMove::Deviated);
            plant.step(false, plant.measured, gains);
            continue;
        }
        plant.step(!move.resting(), move.reference(), gains);
    }
    result.status = tuner.status();
    return result;
}

static void checkInBounds(PidTuner::Gains gains)
{
    CHECK(gains.p >= 0.5 && gains.p <= 20);
    CHECK(gains.d >= 100 && gains.d <= 50000);
}

static void testImprovesUnderdampedGains()
{
    PidTuner tuner;
    Plant plant;
    tuner.start({3, 0, 600}, c_center, c_amplitude);
    CHECK(tuner.active());
    const auto run = tune(tuner, plant);
    CHECK(run.status == PidTuner::Finished);
    CHECK(!tuner.active());
    CHECK(tuner.trials() <= 20);
    CHECK(tuner.bestScore() < tuner.baselineScore() * 0.8);
    CHECK(tuner.best().d > 600);
    CHECK(tuner.best().i == 0);
    checkInBounds(tuner.best());
    printf("underdamped: %.2f -> %.2f in %d trials, %.0f s, P %.2f D %.0f\n",
        tuner.baselineScore(), tuner.bestScore(), tuner.trials(), run.duration, tuner.best().p, tuner.best().d);
}

static void testImprovesSluggishGains()
{
    PidTuner tuner;
    Plant plant;
    tuner.start({1, 0.5, 20000}, c_center, c_amplitude);
    const auto run = tune(tuner, plant);
    CHECK(run.status == PidTuner::Finished);
    CHECK(tuner.bestScore() < tuner.baselineScore() * 0.8);
    CHECK(tuner.best().i == 0.5); // untouched
    checkInBounds(tuner.best());
    printf("sluggish: %.2f -> %.2f in %d trials, %.0f s, P %.2f D %.0f\n",
        tuner.baselineScore(), tuner.bestScore(), tuner.trials(), run.duration, tuner.best().p, tuner.best().d);
}

static void testKeepsGoodGains()
{
    PidTuner tuner;
    Plant plant;
    tuner.start({6, 0, 2000}, c_center, c_amplitude);
    const auto run = tune(tuner, plant);
    CHECK(run.status == PidTuner::Finished);
    CHECK(tuner.bestScore() <= tuner.baselineScore());
    // already about right: no gain moves far
    CHECK(tuner.best().p >= 3 && tuner.best().p <= 12);
    CHECK(tuner.best().d >= 1000 && tuner.best().d <= 4000);
    printf("good: %.2f -> %.2f in %d trials, P %.2f D %.0f\n",
        tuner.baselineScore(), tuner.bestScore(), tuner.trials(), tuner.best().p, tuner.best().d);
}

static void testFailsWhenTheApproachFails()
{
    PidTuner tuner;
    Plant plant;
    plant.friction = 1e9; // stuck
    tuner.start({6, 0, 2000}, c_center, c_amplitude);
    const auto run = tune(tuner, plant);
    CHECK(run.status == PidTuner::Failed);
    CHECK(tuner.trials() == 0);
    CHECK(!tuner.active());
}

static void testFailsWhenTheInitialGainsAreUnstable()
{
    PidTuner tuner;
    tuner.start({6, 0, 2000}, c_center, c_amplitude);
    Vector2D target;
    double speed;
    CHECK(tuner.nextMove(Vector2D(0, -50), target, speed));
    CHECK((target - c_center).length() < 1e-9);
    CHECK(std::fabs(1 / speed - 50.0 / 15) < 1e-9); // 15 mm/s
    tuner.moveEnded(HandleMove::Landed);

    // the baseline trial oscillates
    CHECK(tuner.nextMove(c_center, target, speed));
    CHECK((target - Vector2D(25, -100)).length() < 1e-9);
    auto stable = true;
    for (auto frame = 0; frame < 100 && stable; ++frame)
    {
        stable = tuner.sample(Vector2D(frame % 2 ? 0 : 25, -100), c_center, c_dt);
    }
    CHECK(!stable);
    tuner.moveEnded(HandleMove::Deviated);
    CHECK(tuner.status() == PidTuner::Failed);
    CHECK(!tuner.nextMove(c_center, target, speed));
}

static void testAbortedTrialRecovers()
{
    PidTuner tuner;
    tuner.start({6, 0, 2000}, c_center, c_amplitude);
    Vector2D target;
    double speed;
    tuner.nextMove(c_center, target, speed);
    tuner.moveEnded(HandleMove::Landed);

    // baseline: every move lands right after the tween
    for (auto move = 0; move < 10; ++move)
    {
        CHECK(tuner.nextMove(c_center, target, speed));
        CHECK(tuner.gains().p == 6);
        tuner.sample(target, target, 0.6);
        tuner.moveEnded(HandleMove::Landed);
    }
    CHECK(tuner.trials() == 1);
    CHECK(tuner.baselineScore() == 0); // on target the whole time

    // the first candidate doubles P and leaves the path
    CHECK(tuner.nextMove(c_center, target, speed));
    CHECK(tuner.gains().p == 12);
    CHECK(tuner.gains().d == 2000);
    tuner.moveEnded(HandleMove::Deviated);
    CHECK(tuner.trials() == 2);
    CHECK(tuner.active());

    // back to the center with the best gains, then the next candidate halves P
    CHECK(tuner.nextMove(Vector2D(40, -100), target, speed));
    CHECK((target - c_center).length() < 1e-9);
    CHECK(tuner.gains().p == 6);
    tuner.moveEnded(HandleMove::Landed);
    CHECK(tuner.nextMove(c_center, target, speed));
    CHECK(tuner.gains().p == 3);
    CHECK(tuner.best().p == 6);
}

static void testCancel()
{
    PidTuner tuner;
    tuner.start({6, 0, 2000}, c_center, c_amplitude);
    tuner.cancel();
    CHECK(!tuner.active());
    CHECK(tuner.status() == PidTuner::Idle);
    Vector2D target;
    double speed;
    CHECK(!tuner.nextMove(c_center, target, speed));
    tuner.moveEnded(HandleMove::Landed); // ignored
    CHECK(tuner.status() == PidTuner::Idle);
}

static void testGainsStayInBoundsAtTheEdge()
{
    PidTuner tuner;
    Plant plant;
    tuner.start({20, 0, 50000}, c_center, c_amplitude);
    const auto run = tune(tuner, plant);
    CHECK(run.status == PidTuner::Finished || run.status == PidTuner::Failed);
    checkInBounds(tuner.best());
}

int main()
{
    testImprovesUnderdampedGains();
    testImprovesSluggishGains();
    testKeepsGoodGains();
    testFailsWhenTheApproachFails();
    testFailsWhenTheInitialGainsAreUnstable();
    testAbortedTrialRecovers();
    testCancel();
    testGainsStayInBoundsAtTheEdge();

    if (failures == 0)
    {
        printf("All tests passed\n");
    }
    return failures == 0 ? 0 : 1;
}
