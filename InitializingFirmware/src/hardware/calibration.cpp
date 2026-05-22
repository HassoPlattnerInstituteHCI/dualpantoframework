#include "hardware/calibration.hpp"
#include <Preferences.h>

Preferences prefs;

void saveCalibrationData(CalibrationData data) {
  prefs.begin("calibration", false);
  prefs.putBytes("cal_data", &data, sizeof(CalibrationData));
  prefs.end();
}

CalibrationData loadCalibrationData() {
  CalibrationData data = {0, 0, 0, 0, 0, false};
  prefs.begin("calibration", true);
  prefs.getBytes("cal_data", &data, sizeof(CalibrationData));
  prefs.end();
  return data;
}

bool calibrationDataExists() {
  CalibrationData data = {0, 0, 0, 0, 0, false};
  prefs.begin("calibration", true);
  size_t length = prefs.getBytes("cal_data", &data, sizeof(CalibrationData));
  prefs.end();
  return length;
}