#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <hardwareSerial.h>
#include <string>
#include <cctype>
#include <utility>
#include <algorithm>
#include "bluetoothMain.hpp"

// UUIDs for the BLE service and characteristic

// // https://community.platformio.org/t/esp32-s3-zero-does-not-work-on-platformio/40297/6 <= esp32s3zero fix hopefully
// #define SERVICE_UUID    "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
// #define DEBUG_CHAR_UUID  "beb5483e-36e1-4688-b7f5-ea07361b26a8"


BLECharacteristic *pDebugCharacteristic;



// BLE server callback class for handling BLE events
class DebugServerCallbacks: public BLEServerCallbacks {
    // Called when a BLE device connects to the ESP32
    void onConnect(BLEServer* pServer) {
    }

    // Called when a BLE device disconnects from the ESP32
    void onDisconnect(BLEServer* pServer) {
        pServer->startAdvertising(); // Restart advertising to allow new connections - STOP THE FUCKING MOTOR
    }
};

// BLE characteristic callback class for handling data written to the characteristic (kinda useless rn)
class ESP32Callbacks: public BLECharacteristicCallbacks {
    // Called when data is written to the characteristic
    void onWrite(BLECharacteristic *pCharacteristic) {
        std::string value = pCharacteristic->getValue(); // Get the written value
    }
};

void setup_bluetooth() {

    // Initialize BLE device with a unique name
    BLEDevice::init("ESP32_Control");
    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new DebugServerCallbacks()); // Set server callbacks

    // Create BLE service and characteristic
    BLEService *pService = pServer->createService(SERVICE_UUID);
    pDebugCharacteristic = pService->createCharacteristic(
                         DEBUG_CHAR_UUID,
                         BLECharacteristic::PROPERTY_READ |
                         BLECharacteristic::PROPERTY_NOTIFY
                     );

    // Set characteristic callbacks and start the service
    pDebugCharacteristic->setCallbacks(new ESP32Callbacks());
    pDebugCharacteristic->setValue("Debugging interface for DualPanto");
    pService->start();

    // Setup BLE advertising
    BLEAdvertising *pAdvertising = pServer->getAdvertising();
    pAdvertising->setAppearance(0x1234);
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    pAdvertising->start();

    Serial.println("BLE Device Initialized and Ready");

    pDebugCharacteristic->setValue("Debugging interface for DualPanto"); // Set the characteristic value
    pDebugCharacteristic->notify(); // Notify connected device of the new value
}

void sendDebugLog(const std::string& message) {
    if (pDebugCharacteristic) {
        pDebugCharacteristic->setValue(message);
        pDebugCharacteristic->notify(); // Notify connected device of the new value
    }
}