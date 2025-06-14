#ifndef BLUETOOTH_MAIN_HPP
#define BLUETOOTH_MAIN_HPP

#include <cstdint>          // for fixed-width types
#include <BLEDevice.h>      // forward-declare BLE classes below
#include <BLECharacteristic.h>

// ──────────────────────────────────────────────────────────────────────────────
//  Public constants
// ──────────────────────────────────────────────────────────────────────────────
/** Primary GATT service carrying the debug characteristic. */
constexpr char SERVICE_UUID[]     = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
/** Characteristic used to stream text-based debug messages. */
constexpr char DEBUG_CHAR_UUID[]  = "beb5483e-36e1-4688-b7f5-ea07361b26a8";


// ──────────────────────────────────────────────────────────────────────────────
//  Public state
// ──────────────────────────────────────────────────────────────────────────────
/**
 * Pointer to the debug characteristic created in `setup_bluetooth()`.
 * You can use this handle elsewhere to push custom debug strings, e.g.
 *
 * ```cpp
 * extern BLECharacteristic* pDebugCharacteristic;
 * pDebugCharacteristic->setValue("hello");
 * pDebugCharacteristic->notify();
 * ```
 */
extern BLECharacteristic* pDebugCharacteristic;

// ──────────────────────────────────────────────────────────────────────────────
//  Public API
// ──────────────────────────────────────────────────────────────────────────────
/**
 * Initialise the ESP32 BLE stack, start advertising and set up the
 * debug service/characteristic.
 *
 * Call this once in your global `setup()` function.
 */
void setup_bluetooth();

#endif  // BLUETOOTH_MAIN_HPP