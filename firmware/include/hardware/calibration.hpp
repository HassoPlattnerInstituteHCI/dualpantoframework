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

// PID gains of the linkage motors of one panto, found by the PID calibration. Stored separately from CalibrationData,
// so that the calibration firmware doesn't have to know about them and the stored size of that one stays the same.
struct PidCalibrationData {
  uint32_t version;
  float p;
  float i;
  float d;
};

void savePidCalibrationData(uint8_t pantoIndex, PidCalibrationData data);
// false if there is none, or it is from another version or invalid
bool loadPidCalibrationData(uint8_t pantoIndex, PidCalibrationData& data);
