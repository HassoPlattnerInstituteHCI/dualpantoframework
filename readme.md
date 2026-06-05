# Dualpanto Firmware
Welcome to the `dualpantoframework` repository.
This repository contains the JS framework to generate hardware config, firmware and some useful tools to debug and test the pantograph.

## For BIS students
Currently this repo is mainly used for Firmware and Kinematics lecutre of Bulding Interactive System (BIS) class. Please read `Pre-Installation` and `Firmware Uploading` sections. If you have any question, please ask to your TA.

# Pre-Installation

## Install the ESP32 driver

- [Download](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers?tab=downloads) the installer for your OS-Version.
- Run the installer.

## Setup C++ environment

- Install node (v12.22.1) and npm (v6.14.12)

### macOS
 - Go to Appstore and install Xcode
 - Run `xcode-select –install` to install the compilers
 - Run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

 ### windows
 - Install Visual Studio 2019 or 2017
 - Select at least the workload “Desktopentwicklung mit C++”


## Install Platformio
Please follow the respective instruction.
- [VS code user](https://docs.platformio.org/en/latest/integration/ide/vscode.html)
- [CLion user](https://www.jetbrains.com/help/clion/platformio.html)

# Firmware Uploading

## Generate hardware config via npm
`npm run script config`

This converts each version's hardware config file written in json into .hpp and .cpp file in firmware.

## Types of Firmware
There are TWO individual firmwares on this branch. One is in the `firmware` folder and can be used standalone. The other one is in the `calibrationFirmware` folder. These are individual PIO projects. Just open either one of the folders with your editor, and the upload button of PIO will upload the correct firmware.

### Calibration (Instructions)
Before uploading the regular firmware to the device, we can upload `calibrationFirmware` to store some calibration information permanently to the device. For this, bring the handles to the closed position (as far back as possible), and rotate the end effectors into a distinct/memorable position, e.g. facing **precisely** towards you.

1. **Absolute encoders** The linkage encoders (on the big motors) have absolute positioning. When flashing the `calibrationFirmware`, the encoder values are immediately read and permanently stored to non-volatile storage. The device now remembers this position as the closed position. This means that from now on, the handles can be in any position on devive startup, and tracking still works. If no calibration data is present, the regular firmware expects the handles to be in closed position on every start.
2. **Determine the end effector gear ratios**
Unfortunately, there are at least four different end effector gear boxes in circulation at the moment. The `calibrationFirmware` can distinguish between them, and permanently save their type to non-volatile storage. For this, some human input is needed.
For each end effector:
- Rotate the end effector **three times** clockwise (looking from the top). Try to be very precise! Since the difference between gear ratios is rather small, precision is key here. Since the linkage calibration is already done, you can pull the handles out a bit for easier rotation.
- Rotate the end effector counterclockwise for about half a revolution. This signals to the firmware that the calibration is done.

*Remember: The end effector encoders are relative, meaning they still need to be in a known position on startup to register correctly. However, this calibration ensures that the handle rotation has the correct speed.*

When you have finished the calibration, proceed to uploading the regular `firmware`.

### Regular Use
Wether you chose to calibrate the device or not, the regular `firmware` is required to use the device with Unity. Just follow the regular upload instructions.

## How to Upload

1. If on Windows, comment out the upload port specification in the `platformio.ini` file.
2. Start the upload. In VSCode, this is done by clicking the arrow in the bottom toolbar. These guides also contain instructions on how to upload:
 - [VS code user](https://docs.platformio.org/en/latest/integration/ide/vscode.html)
 - [CLion user](https://www.jetbrains.com/help/clion/platformio.html)
3. When the terminal output gets stuck on `Connecting....`, press and hold the button on the far side of the USB port, until the upload continues.
   <img width="3072" height="939" alt="dualpanto_switch" src="https://github.com/user-attachments/assets/d64c3176-e590-4c26-8e53-fc821e311579" />


## Troubleshooting

OSX: if you want to upload a new firmware version to a device you have to make sure the `upload_port` of platformio is set correctly in the firmware/platformio.ini file like this:
`upload_port = /dev/cu.SLAB_USBtoUART` 

# Development
[![CircleCI](https://circleci.com/gh/HassoPlattnerInstituteHCI/dualpantoframework.svg?style=svg&circle-token=32b766f8a9d2c9a0c612d215322a6dab4aec813d)](https://circleci.com/gh/HassoPlattnerInstituteHCI/dualpantoframework)

version 0.3

dev : Jonas Bounama, Lukas Wagner, Daniel-Amadeus Johannes Glöckner, Julius Rudolph, Oliver Schneider, Jotaro Shigeyama, Alexander Meißner, Nico Böckhoff, **Shohei Katakura (active developer)**

firstname.lastname@hpi.de

## Documentation
- `Transmission Protocol`: The communication protocol between the framework and the device is specified [here](documentation/protocol/protocol.md).
- `setup`:  Instuctions on how to set up the framework for different operating systems.


