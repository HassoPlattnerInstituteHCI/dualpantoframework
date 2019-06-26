#pragma once

// template func must be in header to compile all necessary variants
template <typename T> int sgn(T val)
{
    return (T(0) < val) - (val < T(0));
};
