/* eslint-disable require-jsdoc */
'use strict';

const {exec, remove, color} = require('./tools');

function log(message, messageColor) {
  console.log(`${messageColor}${message}${color.reset}`);
}

const buildHandlers = {
  'framework': () => {
    return build('voice-command')
         & build('serial-plugin')
         & build('serial-standalone');
  },
  'voice-command': () => {
    return exec('node', ['./voice-command/build/build-release.js']);
  },
  'serial-plugin': () => {
    return exec('node-gyp', ['configure'])
         & exec('node-gyp', ['build']);
  },
  'serial-standalone': () => {
    // eslint-disable-next-line max-len
    return exec(cppExec, cppArgs.concat(['Utils/Serial/serial.cpp', 'Protocol/lib/protocol.cpp', '-IProtocol/include', '-o Utils/Serial/serial']));
  },
  'firmware': () => {
    return config(process.argv[4])
         & platformio('build');
  }
};

function build(target) {
  if (target === undefined) {
    return build('framework')
         & build('firmware');
  }

  if (!buildHandlers.hasOwnProperty(target)) {
    log(`Invalid build target ${target}`, color.red);
    return false;
  }

  log(`Building ${target}`, color.green);
  const result = buildHandlers[target]();
  if (result) {
    log(`Building ${target} successful`, color.green);
  } else {
    log(`Building ${target} failed`, color.red);
  }
  return result;
}

const cleanHandlers = {
  'framework': () => {
    clean('voice-command');
    clean('serial-plugin');
    clean('serial-standalone');
  },
  'voice-command': () => {
    remove('./voice-command/.bin');
  },
  'serial-plugin': () => {
    remove('./build');
  },
  'serial-standalone': () => {
    log('Clean serial-standalone not implemented yet', color.yellow);
  },
  'firmware': () => {
    remove('./Firmware/shared/lib/config.cpp');
    remove('./Firmware/shared/include/config.hpp');
    platformio('clean');
  }
};

function clean(target) {
  if (target === undefined) {
    clean('framework');
    clean('firmware');
    return;
  }

  if (!cleanHandlers.hasOwnProperty(target)) {
    log(`Invalid clean target ${target}`, color.red);
    return;
  }

  log(`Clean ${target}`, color.green);
  cleanHandlers[target]();
}

function config(target) {
  if (target === undefined) {
    target = 'doerte';
  }
  log(`Generating config ${target}`, color.green);
  return exec('node', ['Utils/Scripts/generateHardwareConfig.js', target]);
}

function platformio(command) {
  if (command == 'build' || command === undefined) {
    command = '.';
  }
  log(`Running platformio ${command}`, color.green);
  return exec(platformioExec, ['run', '-d Firmware', `-t ${command}`]);
}

function docs() {
  log(`Building docs`, color.green);
  return exec('node', ['Utils/Scripts/docs.js']);
}

const handlers = {
  'build': build,
  'clean': clean,
  'config': config,
  'platformio': platformio,
  'docs': docs
};

let platformioExec;
let cppExec;
let cppArgs;
if (process.platform == 'win32') {
  platformioExec = '"%userprofile%/.platformio/penv/Scripts/platformio"';
  cppExec = 'cl';
  cppArgs = ['/Fo:Utils\\Serial\\'];
} else {
  if (exec('which', ['platformio'])) {
    platformioExec = 'platformio';
  } else {
    platformioExec = '~/.platformio/penv/bin/platformio';
  }
  if (process.platform == 'linux') {
    cppExec = 'g++';
    cppArgs = ['-std=c++11'];
  } else {
    cppExec = 'clang++';
    cppArgs = ['-std=c++11'];
  }
}

const command = process.argv[2];
if (!handlers.hasOwnProperty(command)) {
  log(`Unknown command ${command}`, color.red);
  return;
}
log(`=== Running ${command} ===`, color.green);
const result = handlers[command](process.argv[3]);
if (result) {
  log(`=== ${command} successful ===`, color.green);
} else {
  log(`=== ${command} failed ===`, color.red);
}
