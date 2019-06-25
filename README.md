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
- `docs` - builds the documentation
- `svgToJs` - converts a given svg into a script, which will be stored as `prototype.js` one level above the framework

## Transmission Protocol

The communication protocol between the framework and the device is specified [here](documentation/protocol/protocol.md).

## Examples

...under construction...
 