/* eslint-disable require-jsdoc */
const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');

const colorRed = '\x1b[31m';
const colorGreen = '\x1b[32m';
const colorYellow = '\x1b[33m';
const colorReset = '\x1b[0m';

function exec(cmd, args) {
  return childProcess.spawnSync(
      cmd,
      args,
      {
        shell: true,
        stdio: ['ignore', process.stdout, process.stderr]
      }).status == 0;
};

function log(message, color) {
  console.log(`${color}${message}${colorReset}`);
}

function remove(target) {
  if (!fs.existsSync(target)) {
    log(`Could not find ${target}`, colorYellow);
    return;
  }
  if (fs.statSync(target).isDirectory()) {
    const content = fs.readdirSync(target);
    for (const entry in content) {
      if (content.hasOwnProperty(entry)) {
        remove(path.join(target, content[entry]));
      }
    }
    fs.rmdirSync(target);
  } else {
    fs.unlinkSync(target);
  }
  console.log(`Removed ${target}`);
}

buildHandlers = {
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
    return exec(cppExec, ['Utils/Serial/serial.cpp', 'Protocol/lib/protocol.cpp', '-IProtocol/include', '-o Utils/Serial/serial']);
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
    log(`Invalid build target ${target}`, colorRed);
    return false;
  }

  log(`Building ${target}`, colorGreen);
  const result = buildHandlers[target]();
  if (result) {
    log(`Building ${target} successful`, colorGreen);
  } else {
    log(`Building ${target} failed`, colorRed);
  }
  return result;
}

cleanHandlers = {
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
    log('Clean serial-standalone not implemented yet', colorYellow);
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
    log(`Invalid clean target ${target}`, colorRed);
    return;
  }

  log(`Clean ${target}`, colorGreen);
  cleanHandlers[target]();
}

function config(target) {
  if (target === undefined) {
    target = 'barbie';
  }
  log(`Generating config ${target}`, colorGreen);
  return exec('node', ['Firmware/GenerateHardwareConfig.js', target]);
}

function platformio(command) {
  if (command == 'build') {
    command = '.';
  }
  log(`Running platformio ${command}`, colorGreen);
  return exec(platformioExec, ['run', '-d Firmware', `-t ${command}`]);
}

const handlers = {
  'build': build,
  'clean': clean,
  'config': config,
  'platformio': platformio
};

let platformioExec;
let cppExec;
if (process.platform == 'win32') {
  platformioExec = '"%userprofile%/.platformio/penv/Scripts/platformio"';
  cppExec = 'cl /Fo:Utils\\Serial\\';
} else {
  if (childProcess.execSync('which platformio').toString().length > 0) {
    platformioExec = 'platformio';
  } else {
    platformioExec = '~/.platformio/penv/bin/platformio';
  }
  if (process.platform == 'linux') {
    cppExec = 'g++';
  } else {
    cppExec = 'clang++';
  }
}

const command = process.argv[2];
if (!handlers.hasOwnProperty(command)) {
  log(`Unknown command ${command}`, colorRed);
  return;
}
handlers[command](process.argv[3]);
