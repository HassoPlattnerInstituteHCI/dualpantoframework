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

## Upload Firmware
Please follow the respective instruction.
- [VS code user](https://docs.platformio.org/en/latest/integration/ide/vscode.html)
- [CLion user](https://www.jetbrains.com/help/clion/platformio.html)

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


