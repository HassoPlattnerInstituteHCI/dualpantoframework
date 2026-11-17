#pragma once

#include "utils/vector.hpp"

/*
A move of the handle to a target position. Runs in three phases:

1. Tween: the reference moves from the start to the target in 1 / speed seconds, but not faster than c_maxSpeed.
   It speeds up and slows down smoothly (minimum jerk), since a jump of the reference's speed makes the linkage oscillate.
2. Settle: the reference stays at the target until the handle was within c_landingTolerance and still for c_landingDwell.
   If the handle stops short of the target (friction, kinematics offset), the reference is slowly shifted past the target until it gets there.
3. Rest: the motors are released for c_restTime, since the handle springs back a bit. If it comes to rest outside of the tolerance, the
   difference is added to the point to settle at, the reference moves there from the handle and the move goes back to phase 2.

The move ends and the motors have to be released if the handle didn't land in time, or as soon as it got too far off the path.
*/
class HandleMove
{
public:
    enum Status
    {
        Idle,
        Running,
        Landed,
        TimedOut,
        Deviated
    };

private:
    static constexpr double c_landingTolerance = 0.5; // mm
    static constexpr double c_landingHysteresis = 0.15; // mm
    static constexpr double c_landingDwell = 0.1; // s; has to stay within the tolerance this long, so passing through the target doesn't count
    static constexpr double c_landingStillness = 0.25; // mm; moved further during the dwell it is only passing through, and would coast on after the release
    static constexpr double c_restTime = 0.25; // s
    static constexpr double c_maxRebound = 4; // mm; a larger rest error isn't a rebound that would happen again
    static constexpr double c_retrySpeed = 20; // mm/s, peak
    // mm/s, peak speed of the reference. Long moves at 1 / speed seconds would otherwise be fast enough to leave the path.
    static constexpr double c_maxSpeed = 100;
    // peak speed of the minimum jerk profile, relative to the mean speed
    static constexpr double c_profilePeak = 1.875;
    static constexpr double c_correctionDelay = 0.2; // s; the handle lags behind at the end of the tween, this isn't an error to correct yet
    static constexpr double c_correctionRate = 4; // mm/s per mm of error
    static constexpr double c_correctionRange = 5; // mm; a larger error isn't friction. Pushing on would only make the handle jump once it gets free
    static constexpr double c_maxCorrection = 5; // mm
    static constexpr double c_maxPathDeviation = 10; // mm
    static constexpr double c_settleTimeout = 3; // s
    static constexpr double c_maxTweenDuration = 30; // s; also limits the time for very low or invalid speeds

    bool m_active = false;
    bool m_resting = false;
    Vector2D m_start = Vector2D(0, 0);
    Vector2D m_target = Vector2D(0, 0);
    Vector2D m_correction = Vector2D(0, 0);
    Vector2D m_restCompensation = Vector2D(0, 0);
    Vector2D m_reference = Vector2D(0, 0);
    Vector2D m_tweenStart = Vector2D(0, 0);
    Vector2D m_tweenEnd = Vector2D(0, 0);
    Vector2D m_dwellPosition = Vector2D(0, 0);
    double m_speed = 0;
    double m_tweenValue = 0;
    double m_timeLeft = 0;
    double m_settleTime = 0;
    double m_dwellTime = 0;
    double m_restTime = 0;

    static Vector2D limited(Vector2D vector, double maxLength);
    // 0 to 1 with zero speed and acceleration at both ends
    static double profile(double tweenValue);
    // tween value per second for a tween over distance that takes at least duration
    static double tweenRate(double distance, double duration);
    double pathDeviation(Vector2D handlePosition);

public:
    void start(Vector2D start, Vector2D target, double speed);
    void cancel();
    // advances the move by dt seconds, the status is only Landed, TimedOut or Deviated for the frame the move ends in
    Status update(Vector2D handlePosition, double dt);
    bool active() const;
    // the motors have to be released while this is true
    bool resting() const;
    Vector2D reference() const;
};
