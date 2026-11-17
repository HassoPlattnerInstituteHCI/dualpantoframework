#include "hardware/pidTuner.hpp"

#include <cmath>

// out and back in four directions, then a short diagonal one; ends at the center, where the next trial starts
const double PidTuner::c_pattern[c_patternLength][2] = {
    {1, 0}, {0, 0},
    {0, -1}, {0, 0},
    {-1, 0}, {0, 0},
    {0, 1}, {0, 0},
    {0.3, 0.3}, {0, 0}};

double PidTuner::clamp(double value, double min, double max)
{
    return value < min ? min : value > max ? max : value;
}

void PidTuner::start(Gains initial, Vector2D center, double amplitude)
{
    m_status = Running;
    m_phase = Approach;
    m_center = center;
    m_amplitude = amplitude;
    m_initial = initial;
    m_best = initial;
    m_candidate = initial;
    m_hasBaseline = false;
    m_baselineScore = 0;
    m_bestScore = 0;
    m_step = c_initialStep;
    m_axis = 0;
    m_direction = 0;
    m_improvedThisRound = false;
    m_trials = 0;
    m_moveIndex = 0;
    m_trialCost = 0;
    m_moveRunning = false;
}

void PidTuner::cancel()
{
    m_status = Idle;
    m_moveRunning = false;
}

bool PidTuner::active() const
{
    return m_status == Running;
}

PidTuner::Status PidTuner::status() const
{
    return m_status;
}

bool PidTuner::nextMove(Vector2D handlePosition, Vector2D& target, double& speed)
{
    if (m_status != Running)
    {
        return false;
    }

    if (m_phase == Trial)
    {
        const auto offset = c_pattern[m_moveIndex];
        target = m_center + Vector2D(offset[0], offset[1]) * m_amplitude;
        speed = c_moveSpeed;
    }
    else
    {
        target = m_center;
        const auto distance = (target - handlePosition).length();
        speed = c_approachSpeed / (distance > 1 ? distance : 1);
    }

    m_moveRunning = true;
    m_moveStart = handlePosition;
    m_moveTarget = target;
    m_lastCounted = handlePosition;
    m_tweenDuration = 1 / speed;
    m_moveTime = 0;
    m_lastOutsideTime = 0;
    m_trackingError = 0;
    m_overshoot = 0;
    m_traveled = 0;
    return true;
}

PidTuner::Gains PidTuner::gains() const
{
    return m_phase == Trial ? m_candidate : m_best;
}

bool PidTuner::sample(Vector2D handlePosition, Vector2D reference, double dt)
{
    if (!m_moveRunning)
    {
        return true;
    }
    m_moveTime += dt;
    if (std::isnan(handlePosition.x) || std::isnan(handlePosition.y))
    {
        return true;
    }

    if (m_moveTime <= m_tweenDuration)
    {
        m_trackingError += (reference - handlePosition).length() * dt;
    }
    if ((m_moveTarget - handlePosition).length() > c_settleTolerance)
    {
        m_lastOutsideTime = m_moveTime;
    }

    const auto path = m_moveTarget - m_moveStart;
    const auto pathLength = path.length();
    if (pathLength > 0)
    {
        const auto along = (handlePosition - m_moveStart) * path * (1 / pathLength);
        if (along - pathLength > m_overshoot)
        {
            m_overshoot = along - pathLength;
        }
    }

    const auto step = (handlePosition - m_lastCounted).length();
    if (step > c_pathDeadband)
    {
        m_traveled += step;
        m_lastCounted = handlePosition;
    }

    return m_phase != Trial || m_traveled - pathLength <= c_maxExcess;
}

double PidTuner::moveCost(HandleMove::Status status) const
{
    // a timed out move never settled
    const auto settledAt = status == HandleMove::Landed ? m_lastOutsideTime : m_moveTime;
    const auto settleTime = settledAt > m_tweenDuration ? settledAt - m_tweenDuration : 0;
    const auto excess = m_traveled - (m_moveTarget - m_moveStart).length();
    return settleTime +
        c_trackingWeight * m_trackingError / m_tweenDuration +
        c_overshootWeight * m_overshoot +
        c_excessWeight * (excess > 0 ? excess : 0) +
        (status == HandleMove::TimedOut ? c_timeoutCost : 0);
}

void PidTuner::moveEnded(HandleMove::Status status)
{
    if (m_status != Running || !m_moveRunning)
    {
        return;
    }
    m_moveRunning = false;

    if (m_phase != Trial)
    {
        if (status != HandleMove::Landed)
        {
            // can't even get to the center with gains known to work
            m_status = Failed;
            return;
        }
        m_phase = Trial;
        m_moveIndex = 0;
        m_trialCost = 0;
        return;
    }

    if (status == HandleMove::Deviated || status == HandleMove::Idle)
    {
        finishTrial(INFINITY, true);
        return;
    }

    m_trialCost += moveCost(status);
    if (++m_moveIndex == c_patternLength)
    {
        finishTrial(m_trialCost / c_patternLength, false);
    }
}

void PidTuner::finishTrial(double cost, bool aborted)
{
    m_trials++;
    m_lastTrialGains = m_candidate;
    m_lastTrialScore = cost;
    if (!m_hasBaseline)
    {
        if (aborted)
        {
            m_status = Failed;
            return;
        }
        m_hasBaseline = true;
        m_baselineScore = cost;
        m_bestScore = cost;
    }
    else if (cost < m_bestScore * (1 - c_minImprovement))
    {
        m_best = m_candidate;
        m_bestScore = cost;
        m_improvedThisRound = true;
        m_direction = 2; // no need to try the other direction of this gain
    }

    if (!nextCandidate())
    {
        m_status = Finished;
        return;
    }
    m_moveIndex = 0;
    m_trialCost = 0;
    m_phase = aborted ? Recover : Trial;
}

bool PidTuner::nextCandidate()
{
    while (m_trials < c_maxTrials)
    {
        if (m_direction > 1)
        {
            m_direction = 0;
            m_axis++;
        }
        if (m_axis > 1)
        {
            m_axis = 0;
            if (!m_improvedThisRound)
            {
                m_step = std::sqrt(m_step);
                if (m_step < c_minStep)
                {
                    return false;
                }
            }
            m_improvedThisRound = false;
        }

        const auto factor = m_direction == 0 ? m_step : 1 / m_step;
        m_direction++;
        auto candidate = m_best;
        if (m_axis == 0)
        {
            candidate.p = clamp(candidate.p * factor, c_minP, c_maxP);
        }
        else
        {
            candidate.d = clamp(candidate.d * factor, c_minD, c_maxD);
        }
        // at a bound, the clamped candidate can be the best one again
        if (candidate.p == m_best.p && candidate.d == m_best.d)
        {
            continue;
        }
        m_candidate = candidate;
        return true;
    }
    return false;
}

PidTuner::Gains PidTuner::initial() const
{
    return m_initial;
}

PidTuner::Gains PidTuner::best() const
{
    return m_best;
}

double PidTuner::baselineScore() const
{
    return m_baselineScore;
}

double PidTuner::bestScore() const
{
    return m_bestScore;
}

int PidTuner::trials() const
{
    return m_trials;
}

PidTuner::Gains PidTuner::lastTrialGains() const
{
    return m_lastTrialGains;
}

double PidTuner::lastTrialScore() const
{
    return m_lastTrialScore;
}
