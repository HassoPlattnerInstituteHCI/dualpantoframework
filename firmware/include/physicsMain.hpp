#pragma once

#define BATTERY_PIN 27 // Pin for battery voltage measurement
#define VOLTAGE_SAMPLES 1 // Number of samples for battery voltage averaging
#define PWM_THRESHOLD 1 // PWM value below which we adjust voltage measurements
#include <cstdint>

void physicsSetup();
void physicsLoop();

extern float batteryVoltage;

struct PwmMetrics {
    uint16_t peakPWM = 0; // Peak PWM value
    float peakVoltageIn = 0.0f; // Raw voltage reading from the battery
    uint16_t voltageReadingCount = 0; // Number of voltage readings taken
    float voltageOut = 0.0f; // Computed voltage to be used for scaling
    void addPWMReading(const uint16_t newPeak) {
        if (newPeak > peakPWM) {
            peakPWM = newPeak;
        }
    }
    void addVoltageReading(const float newVoltage) {
        if (newVoltage > peakVoltageIn) {
            peakVoltageIn = newVoltage;
        }
    }
    void calculateNewAverageVoltage(const float newValue) {
        if (newValue == 0.0f) {
            return; // Ignore zero readings
        }
        const auto vRCFloat = static_cast<float>(voltageReadingCount);
        voltageOut = (voltageOut * vRCFloat + newValue) / (vRCFloat + 1.0f);
        voltageReadingCount = voltageReadingCount < VOLTAGE_SAMPLES ?
                                  voltageReadingCount + 1 : VOLTAGE_SAMPLES;
    }
    float getCurrentVoltage(const float reading) const {
        return voltageOut == 0.0f ? reading : voltageOut;
    }
    void step() {

        if (peakPWM < PWM_THRESHOLD){calculateNewAverageVoltage(peakVoltageIn);}

        peakPWM = 0; // Reset peak PWM after each step
        peakVoltageIn = 0.0f; // Reset voltage reading after each step
    }
};

extern PwmMetrics* pwmMetrics;