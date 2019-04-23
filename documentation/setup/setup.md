# Setup

## Dependencies

Follow the dependency setup guide for the platform you're working on: [Windows](windows.md), [Linux](linux.md), [MacOS](macos.md).

## Initial Setup

There are a couple useful scripts defined in `package.json`. The most important is the `install` script. You can use it by running `npm install --production` or `npm i --production`. If you are planing on developing for the dualpantoframework, please use `npm i` to also install the linter and the pre-commit hook.

Note for Windows users: You'll need to run the scripts from an Visual Stutio developer command line, otherwise the compiler won't be accessable. E.g. when using Visual Studio 2017, search for `x64 Native Tools Command Prompt for VS 2017` or `x64 Native Tools-Eingabeaufforderung für VS 2017` (depending on your OS's language) using the Windows search and navigate to the dualpantoframework directory afterwards.

## Uploading the Firmware

In order to upload the firmware to the device, connect it and run `npm run platformio-upload`.

## Calibration

TODO - will be added here
