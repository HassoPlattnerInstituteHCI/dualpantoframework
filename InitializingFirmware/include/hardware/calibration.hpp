#pragma once
#include <cstdint>
#include <vector>

struct CalibrationData {
  uint16_t zero_1;
  uint16_t zero_2;
  uint16_t zero_3;
  uint16_t zero_4;
  uint32_t encoder_steps;
  bool inversed;
};

void saveCalibrationData(CalibrationData data);
CalibrationData loadCalibrationData();