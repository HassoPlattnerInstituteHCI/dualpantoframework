# Dualpanto Firmware

[![CircleCI](https://circleci.com/gh/HassoPlattnerInstituteHCI/dualpantoframework.svg?style=svg&circle-token=32b766f8a9d2c9a0c612d215322a6dab4aec813d)](https://circleci.com/gh/HassoPlattnerInstituteHCI/dualpantoframework)

version 0.3

dev : Jonas Bounama, Lukas Wagner, Daniel-Amadeus Johannes Glöckner, Julius Rudolph, Oliver Schneider, Jotaro Shigeyama, Alexander Meißner, Nico Böckhoff, Shohei Katakura

firstname.lastname@hpi.de

Welcome to the `dualpantoframework` repository!
This repository contains the JS framework for controlling the dualpanto, as well as the firmware and some useful tools to debug and test the pantograph.

# Installation & Firmware Uploading

## Install the ESP32 driver

- [Download](https://www.silabs.com/products/development-tools/software/usb-to-uart-bridge-vcp-drivers) the installer for your OS-Version.
- Run the installer.

## Generate hardware config via npm

## Installation & Setup

A setup guide can be found [here](documentation/setup/setup.md).

# Documentation

The reference for all classes can be found [here](documentation/classes/index.md).



## Transmission Protocol

The communication protocol between the framework and the device is specified [here](documentation/protocol/protocol.md).

## Repository Overview

- `documentation` - \[Markdown\] Contains the documentation about interfaces and setup.
  - `classes` - Documentaion for the classes exported by the framework. Build this using `npm run docs`.
  - `protocol` - Definition of the serial communication protocol. The shared source files implementing this can be found in `./utils/protocol/`. The serial implementations are stored in `./firmware/utils/` (firmware side) and `./utils/serial/` (framework side).
  - `setup` - Instuctions on how to set up the framework for different operating systems.
- `examples` - \[JavaScript\] Example scripts on how to use the framework. See [example section](#Examples).
- `firmware` - \[C++\] The firmware for the ESP32 built into the device. Build using the [platformio command](#Available-Scripts).
- `hardware` - \[JSON\] Config files for different hardware iterations. These are used with the [configure command](#Available-Scripts) to generate source files which are then compiled into the firmware.
- `lib` - \[JavaScript\] The dualpantoframework library. Refer the [docs](documentation/classes/index.md) for more info about the files.
- `utils` - Mixed helpers for building and debugging.
  - `backtrace` - \[sh\] Bash script vor decoding the ESP32's crash backtrace. Functionality is built into the framework's serial plugin now, but this script may be used without a platformio installation.
  - `geogebra` - Geometric representations of forward and inverse kinematics. Contains both complete websites for easy use, as well as the scripts used to create those websites.
  - `plotter` - \[JavaScript\] Visualization of the panto's available space and the resolution. Use the [plotter command](#Available-Scripts) to start a server, open the page (note: due to a bug in a dependency, go directly to `[...]/index.html`) and upload one of the hardware config files.
  - `protocol` - \[C++\] Serial protocol base files, shared between firmware and framework. Based on the specification stored in `./documentation/protocol/`.
  - `scripts` - \[JavaScript\] The scripts behind the [commands](#Available-Scripts). Check out `./package.json` and `./utils/scripts/run.js` if you want to add functionality.
  - `serial` - \[C++\] The serial plugin for the framework. Uses the shared protocol files (`./utils/protocol/`) to implement the specification (`./documentation/protocol/`).
  - `svgConverter` - \[JavaScript\] Converts a `svg` file of a level into a `prototype.js` script. Use the [svgToJs command](#Available-Scripts).
  - `viDeb` - \[JavaScript\] Implements a emulated device.
  - `voiceCommand` - \[JavaScript\] Voice input plugin used by the framework.
  

## Generating new serial libraries for Unity

Whenever the interface between Unity and the firmware changes, you need to generate a Serial.dll (Windows) and a libserial.dylib (OSX) file that need to be added to the unity-dualpanto-framework that should be a sub-repo of your project. 

Unfortunately, the Serial.dll can only be generated on Windows and the libserial.dylib needs to be generated on a Mac.

To generate them follow these steps:

`cd utils/serial`

`rm CMakeCache.txt`

`cmake .`

`make`

OSX: 

Copy the libserial.dylib to the unity-dualpanto-framework sub-repo and restart Unity to reimport the Assets.

Windows:

run `unity\win.bat`

This generates the Serial.dll in the folder cppLibBuild/Release.
Copy it over to your unity-dualpanto-framework sub-repo and restart Unity.

## Troubleshooting

OSX: if you want to upload a new firmware version to a device you have to make sure the `upload_port` of platformio is set correctly in the firmware/platformio.ini file like this:
`upload_port = /dev/cu.SLAB_USBtoUART` 
