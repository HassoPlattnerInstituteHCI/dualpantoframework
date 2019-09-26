#pragma once

#include <vector>

#include "hardware/panto.hpp"
#include "physics/godObject.hpp"
#include "utils/vector.hpp"

class PantoPhysics
{
private:
    Panto* m_panto;
    Vector2D m_currentPosition;
    GodObject* m_godObject;
public:
    PantoPhysics(Panto* panto);
    GodObject* godObject();
    void step();
};

extern std::vector<PantoPhysics> pantoPhysics;
