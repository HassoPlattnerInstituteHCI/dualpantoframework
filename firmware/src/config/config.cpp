/*
 * This file is generated by GenerateHardwareConfig.js and ignored in git. Any changes you apply will *not* persist.
 * 
 * config.cpp contains the initial values for the non-const global variables, since defining those in the header leads to linker errors.
 */

#include "config/config.hpp"

float forceFactor = 0.01;
float pidFactor[6][3] = {
  {7, 0, 600}, {7, 0, 600}, {0.3, 0, 30}, {7, 0, 600}, {7, 0, 600}, {0.3, 0, 30}
};