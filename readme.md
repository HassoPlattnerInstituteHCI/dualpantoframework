# DualpantoFramework

[![CircleCI](https://circleci.com/gh/HassoPlattnerInstituteHCI/dualpantoframework.svg?style=svg&circle-token=32b766f8a9d2c9a0c612d215322a6dab4aec813d)](https://circleci.com/gh/HassoPlattnerInstituteHCI/dualpantoframework)

version 0.3

dev : Jonas Bounama, Lukas Wagner, Daniel-Amadeus Johannes Glöckner, Oliver Schneider, Jotaro Shigeyama, Alexander Meißner, Nico Böckhoff

firstname.lastname@hpi.de

Welcome to the `dualpantoframework` repository!
This repository contains the JS framework for controlling the dualpanto, as well as the firmware and some useful tools to debug and test the pantograph.

## Installation & Setup

A setup guide can be found [here](documentation/setup/setup.md).

## Documentation

The reference for all classes can be found [here](documentation/classes/index.md).

## Available Scripts

The `package.json` contains the following scripts which can be run using `npm run [command]`:
- `build [target [config]]` - builds the specified target. Providing no target builds `framework` and `firmware`. Available targets:
  - `framework` - build all framework dependencies. This includes `voice-command`, `serial-plugin` and `serial-standalone`.
  - `voice-command` - node module for voice input
  - `serial-plugin` - node module for serial communication between framework and firmware
  - `serial-standalone` - standalone executable for serial communication between framework and firmware
  - `firmware` - configures the firmware using the default configuration file (or uses the optionally specified one) and builds it afterwards.
- `clean [target]` - builds the specified target. Providing no target cleans `framework` and `firmware`. The available targets are the same as for `build`.
- `configure [config]` - configures the firmware using the specified configuration file. If none is specified, uses the default configuration.
- `platformio [command]` - runs the given PlatformIO command. The available commands can be found [here](https://docs.platformio.org/en/latest/userguide/cmd_run.html#cmdoption-platformio-run-t), the ones you'll probably need are:
  - `build` or `.` - builds the firmware. Please note: `build` is not a default PlatformIO command. It is only provided for easier use and is internally converted to `.`.
  - `upload` - builds and uploads the firmware
  - `clean` - cleans the firmware build cache
- `plotter` - start hosting webpage for plotting the available space
- `docs` - builds the documentation
- `svgToJs` - converts a given svg into a script, which will be stored as `prototype.js` one level above the framework

## Transmission Protocol

The communication protocol between the framework and the device is specified [here](documentation/protocol/protocol.md).

## Examples

The `examples` dir contains multiple example programs, as well as programs for checking the basic functionality.

- `basic` - General examples for checking that the device is working.
  - `connect.js` - Just includes the framework, connecting to any devices currently plugged in and printing the debug messages.
  - `logPos.js` - Logs the position of the device's me and it handles.
  - `move.js` - Moves both handles in a triangle.
  - `updatesPerSecond.js` - Logs the number of position updates received each second.
- `hapticObject` - Examples for how to use the hapticObject/component feature.
  - `collider.js` - How to use the box and mesh collider components.
  - `enableDisable.js` - Allows to enable/disable/remove/add an collider using keyboard input.
  - `forcefield.js` - How to use the box and mesh forcefield components.
  - `hardStep.js` - How to use the box and mesh hardStep components, containing both a hard to enter and one hard to leave hardStep.
  - `rails.js` - Using a forcefield to snap the handle to vertical lines.
  - `trace.js` - Shows how the `trace` function can be used to convey the shape of a component.
  - `trigger.js` - How to use the box and mesh trigger components, both for entering/leaving and touching objects.
- `homefinder` - Contains the interactive homefinder.
  - `homefinder.js` - The interactive homefinder.
- `match` - Multiplayer demos.
  - `match.js` - Mirrors each player's me handle to the opponents it handle.
  - `catch.js` - Mirrors each player's me handle to the opponents it handle. Implements a simple catching game based on this.
- `precisionTest` - Different scripts for checking the device's behaviour in edge cases.
  - `corridor.js` - Horizontal corridor that gets more and more narrow.
  - `gap1mm.js` - Horizontal gap, 1 mm wide.
  - `move.js` - Moves the handle back and forth between two positions.
  - `roomFractal.js` - Multiple conencted rooms that get smaller and smaller.
- `voiceInteraction` - Examples on how to use the sound output.
  - `playSound.js` - Plays sound file.
  - `speakText.js` - Uses the voice output.
- `wall` - Obstacle testing.
  - `wallGenerator.js` - generates a circle obstacle, subdivided into a given number of edges.

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