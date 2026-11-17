#include "hardware/calibration.hpp"
#include <Preferences.h>
#include <cmath>
#include <cstdio>

Preferences prefs;

void saveCalibrationData(CalibrationData data) {
  prefs.begin("calibration", false);
  prefs.putBytes("cal_data", &data, sizeof(CalibrationData));
  prefs.end();
}

CalibrationData loadCalibrationData() {
  CalibrationData data = {0, 0, 0, 0, 271, 271, false, false};
  prefs.begin("calibration", true);
  prefs.getBytes("cal_data", &data, sizeof(CalibrationData));
  prefs.end();
  return data;
}

bool calibrationDataExists() {
  CalibrationData data = {0, 0, 0, 0, 0, 0, false, false};
  prefs.begin("calibration", true);
  size_t length = prefs.getBytes("cal_data", &data, sizeof(CalibrationData));
  prefs.end();
  return length;
}

static const uint32_t c_pidCalibrationVersion = 1;

static void pidCalibrationKey(uint8_t pantoIndex, char* key, size_t size) {
  snprintf(key, size, "pid_%u", pantoIndex);
}

void savePidCalibrationData(uint8_t pantoIndex, PidCalibrationData data) {
  char key[8];
  pidCalibrationKey(pantoIndex, key, sizeof(key));
  data.version = c_pidCalibrationVersion;
  prefs.begin("calibration", false);
  prefs.putBytes(key, &data, sizeof(PidCalibrationData));
  prefs.end();
}

bool loadPidCalibrationData(uint8_t pantoIndex, PidCalibrationData& data) {
  char key[8];
  pidCalibrationKey(pantoIndex, key, sizeof(key));
  PidCalibrationData stored = {0, 0, 0, 0};
  prefs.begin("calibration", true);
  // logs a NOT_FOUND error before the first calibration, that is fine (this core has no Preferences::isKey yet)
  const auto length = prefs.getBytes(key, &stored, sizeof(PidCalibrationData));
  prefs.end();
  if (length != sizeof(PidCalibrationData) || stored.version != c_pidCalibrationVersion ||
      !std::isfinite(stored.p) || !std::isfinite(stored.i) || !std::isfinite(stored.d) ||
      stored.p <= 0 || stored.i < 0 || stored.d < 0) {
    return false;
  }
  data = stored;
  return true;
}
