#pragma once

#include "hardware/handleMove.hpp"
#include "utils/vector.hpp"

/*
Finds the P and D gains of the linkage motors by driving the handle through a fixed pattern of test moves.

The handle first approaches the center of the pattern with the initial gains. Then each trial runs the whole pattern
with one candidate set of gains, using the same HandleMove as regular moves, and scores it by the mean over its moves of:
- how far the handle lagged behind the reference during the tween,
- the time it took after the tween until it entered c_settleTolerance for good (not the fixed dwell and rest of the landing),
- how far the handle overshot the target along the path,
- how much further the handle traveled than the straight distance (oscillation),
- a penalty for every move that timed out.

The first trial measures the initial gains. After that, a coordinate descent in log space tries P and D scaled up and
down by a step factor and keeps a candidate only if it is clearly better than the best so far. Once a round over both
gains finds nothing better, the step gets smaller, until it drops below c_minStep or c_maxTrials is used up.

A trial is aborted as soon as the handle left the path or oscillated too much. The handle then returns to the center
with the best gains before the next candidate is tried. If the initial gains already fail, the tuning fails, since there
is nothing known to be safe to fall back to.

I is not tuned and stays as it is.
*/
class PidTuner
{
public:
    enum Status
    {
        Idle,
        Running,
        Finished,
        Failed
    };

    struct Gains
    {
        double p;
        double i;
        double d;
    };

private:
    enum Phase
    {
        Approach,
        Trial,
        Recover
    };

    static constexpr double c_moveSpeed = 2; // 1/s, so the tween takes 0.5 s
    static constexpr double c_approachSpeed = 15; // mm/s; starts near the closed position, where the linkage follows badly
    static constexpr int c_maxTrials = 20;
    static constexpr double c_initialStep = 2;
    static constexpr double c_minStep = 1.2;
    static constexpr double c_minImprovement = 0.03; // relative; smaller ones are noise
    static constexpr double c_overshootWeight = 0.2; // s per mm
    static constexpr double c_excessWeight = 0.02; // s per mm
    static constexpr double c_trackingWeight = 0.05; // s per mm of mean lag
    static constexpr double c_timeoutCost = 5; // s
    static constexpr double c_settleTolerance = 0.5; // mm, as for landing
    static constexpr double c_pathDeadband = 0.2; // mm; encoder noise isn't traveled distance
    static constexpr double c_maxExcess = 40; // mm; traveled this much more than needed, the gains are unstable
    static constexpr double c_minP = 0.5;
    static constexpr double c_maxP = 20;
    static constexpr double c_minD = 100;
    static constexpr double c_maxD = 50000;
    static constexpr int c_patternLength = 10;
    static const double c_pattern[c_patternLength][2]; // in units of the amplitude, relative to the center

    Status m_status = Idle;
    Phase m_phase = Approach;
    Vector2D m_center = Vector2D(0, 0);
    double m_amplitude = 0;
    Gains m_initial = {0, 0, 0};
    Gains m_best = {0, 0, 0};
    Gains m_candidate = {0, 0, 0};
    bool m_hasBaseline = false;
    double m_baselineScore = 0;
    double m_bestScore = 0;
    double m_step = c_initialStep;
    int m_axis = 0; // 0 for P, 1 for D
    int m_direction = 0; // 0 for up, 1 for down, 2 for done with this axis
    bool m_improvedThisRound = false;
    int m_trials = 0;
    Gains m_lastTrialGains = {0, 0, 0};
    double m_lastTrialScore = 0;
    int m_moveIndex = 0;
    double m_trialCost = 0;

    bool m_moveRunning = false;
    Vector2D m_moveStart = Vector2D(0, 0);
    Vector2D m_moveTarget = Vector2D(0, 0);
    Vector2D m_lastCounted = Vector2D(0, 0);
    double m_tweenDuration = 0;
    double m_moveTime = 0;
    double m_lastOutsideTime = 0;
    double m_trackingError = 0; // integrated over the tween, mm * s
    double m_overshoot = 0;
    double m_traveled = 0;

    static double clamp(double value, double min, double max);
    double moveCost(HandleMove::Status status) const;
    void finishTrial(double cost, bool aborted);
    bool nextCandidate();

public:
    // center and amplitude in mm; the pattern stays within one amplitude around the center
    void start(Gains initial, Vector2D center, double amplitude);
    void cancel();
    bool active() const;
    Status status() const;
    // the next move to run, false once the tuning is over
    bool nextMove(Vector2D handlePosition, Vector2D& target, double& speed);
    // the gains to use for the move returned by nextMove
    Gains gains() const;
    // feeds the handle position and the reference of the move, false if the move has to be aborted since the gains are unstable
    bool sample(Vector2D handlePosition, Vector2D reference, double dt);
    // also for a move aborted by sample, as Deviated
    void moveEnded(HandleMove::Status status);
    Gains initial() const;
    Gains best() const;
    double baselineScore() const;
    double bestScore() const;
    int trials() const;
    // the gains and score of the trial that ended last, the score is infinite for an aborted one
    Gains lastTrialGains() const;
    double lastTrialScore() const;
};
