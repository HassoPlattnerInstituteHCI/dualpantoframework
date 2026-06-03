#pragma once
#include <cstdint>
#include <vector>

struct CalibrationData {
  uint16_t zero_1;
  uint16_t zero_2;
  uint16_t zero_3;
  uint16_t zero_4;
  uint32_t encoder_steps_upper;
  uint32_t encoder_steps_lower;
  bool inversed_upper;
  bool inversed_lower;
};

void saveCalibrationData(CalibrationData data);
CalibrationData loadCalibrationData();
bool calibrationDataExists();