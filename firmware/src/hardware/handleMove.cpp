#include "hardware/handleMove.hpp"

#include <algorithm>
#include <cmath>

Vector2D HandleMove::limited(Vector2D vector, double maxLength)
{
    const auto length = vector.length();
    return length > maxLength ? vector * (maxLength / length) : vector;
}

double HandleMove::pathDeviation(Vector2D handlePosition)
{
    return m_start == m_target
        ? (handlePosition - m_target).length()
        : handlePosition.distancePointToLineSegment(m_start, m_target);
}

void HandleMove::start(Vector2D start, Vector2D target, double speed)
{
    m_active = true;
    m_resting = false;
    m_start = start;
    m_target = target;
    m_correction = Vector2D(0, 0);
    m_restCompensation = Vector2D(0, 0);
    m_reference = start;
    m_tweenStart = start;
    m_tweenEnd = target;
    m_speed = speed > 0 ? speed : 0; // also catches NaN; never reaches the target, so it times out
    m_tweenValue = 0;
    m_settleTime = 0;
    m_dwellTime = 0;
    m_restTime = 0;

    const auto tweenDuration = 1 / m_speed; // infinite for no speed
    m_timeLeft = (tweenDuration < c_maxTweenDuration ? tweenDuration : c_maxTweenDuration) + c_settleTimeout;
}

void HandleMove::cancel()
{
    m_active = false;
    m_resting = false;
}

HandleMove::Status HandleMove::update(Vector2D handlePosition, double dt)
{
    if (!m_active)
    {
        return Idle;
    }

    m_timeLeft -= dt;
    if (m_timeLeft <= 0)
    {
        cancel();
        return TimedOut;
    }

    // the forward kinematics return NaN for invalid encoder values; once in the correction this would stay forever
    const auto isValid = !std::isnan(handlePosition.x) && !std::isnan(handlePosition.y);
    if (isValid && pathDeviation(handlePosition) > c_maxPathDeviation)
    {
        cancel();
        return Deviated;
    }

    if (m_tweenValue < 1)
    {
        m_tweenValue = std::min(m_tweenValue + dt * m_speed, 1.0);
        m_reference = m_tweenStart + (m_tweenEnd - m_tweenStart) * m_tweenValue;
        return Running;
    }

    if (!isValid)
    {
        m_dwellTime = 0;
        return Running;
    }

    if (m_resting)
    {
        m_restTime += dt;
        if (m_restTime < c_restTime)
        {
            return Running;
        }
        const auto restError = m_target - handlePosition;
        if (restError.length() <= c_landingTolerance)
        {
            cancel();
            return Landed;
        }
        m_resting = false;
        if (restError.length() <= c_maxRebound)
        {
            m_restCompensation = limited(m_restCompensation + restError, c_maxCorrection);
        }
        m_correction = Vector2D(0, 0);
        // the motors engage again at the handle, a jump of the reference would kick it away
        m_tweenStart = handlePosition;
        m_reference = handlePosition;
        m_tweenEnd = m_target + m_restCompensation;
        m_tweenValue = 0;
        m_speed = c_retrySpeed / (m_tweenEnd - m_tweenStart).length();
        m_settleTime = 0;
        m_dwellTime = 0;
        return Running;
    }

    m_settleTime += dt;
    const auto settlePoint = m_target + m_restCompensation;
    const auto error = settlePoint - handlePosition;
    const auto errorLength = error.length();
    // once in the tolerance, a single noisy value doesn't start the dwell over
    if (errorLength <= c_landingTolerance + (m_dwellTime > 0 ? c_landingHysteresis : 0))
    {
        if (m_dwellTime == 0 || (handlePosition - m_dwellPosition).length() > c_landingStillness)
        {
            m_dwellPosition = handlePosition;
            m_dwellTime = 0;
        }
        m_dwellTime += dt;
        if (m_dwellTime >= c_landingDwell)
        {
            m_resting = true;
            m_restTime = 0;
        }
        return Running;
    }

    m_dwellTime = 0;
    if (m_settleTime >= c_correctionDelay)
    {
        m_correction = errorLength > c_correctionRange
            ? Vector2D(0, 0)
            : limited(m_correction + error * (c_correctionRate * dt), c_maxCorrection);
        m_reference = settlePoint + m_correction;
    }
    return Running;
}

bool HandleMove::active() const
{
    return m_active;
}

bool HandleMove::resting() const
{
    return m_resting;
}

Vector2D HandleMove::reference() const
{
    return m_reference;
}
