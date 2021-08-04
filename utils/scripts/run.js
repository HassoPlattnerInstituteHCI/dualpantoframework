/* eslint-disable require-jsdoc */
'use strict';

const os = require('os');
const path = require('path');
const {exec, remove, color, escape} = require('./tools');

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
    return exec('node', ['./utils/voiceCommand/build/build-release.js']);
  },
  'serial-plugin': () => {
    const gypDef = '--cppdefs="NODE_GYP ' + escape(cppDefines.join(' ')) + '"';
    return exec('node-gyp', ['configure', '-C utils/serial', gypDef])
         & exec('node-gyp', ['build', '-C utils/serial']);
  },
  'serial-standalone': () => {
    return exec(
        cppExec,
        cppArgs.concat(cppDefines.map((d) => cppDefinePrefix + d)).concat([
          'utils/serial/src/standalone/main.cpp',
          'utils/serial/src/standalone/standalone.cpp',
          'utils/serial/src/serial/shared.cpp',
          'utils/serial/src/cppLib/lib.cpp',
          'utils/serial/src/crashAnalyzer/analyze.cpp',
          'utils/serial/src/crashAnalyzer/buffer.cpp',
          process.platform == 'win32' ?
            'utils/serial/src/serial/win.cpp' :
            'utils/serial/src/serial/unix.cpp',
          'utils/protocol/src/protocol/protocol.cpp',
          '-Iutils/serial/include',
          '-Iutils/protocol/include',
          '-o utils/serial/serial']));
  },
  'unity-serial': () =>{
    return unity();
  },
  'firmware': () => {
    return config(process.argv[4])
         & platformio('build');
  }
};

function build(target) {
  if (target === undefined) {
    return build('firmware');
    // 14.5.21: The js framework is deprecated since this
    // commit: a045c86fa3754810a9a68b1bc89dcf990d883579
    // To make it work again we have to implement the acknowledgement
    // logic, similar to the way it's done in this
    // commit: faa30310e884784b5d431ac65c05e3186b9bafab
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
    return clean('voice-command')
         & clean('serial-plugin')
         & clean('serial-standalone');
  },
  'voice-command': () => {
    return remove('./utils/voiceCommand/.bin');
  },
  'serial-plugin': () => {
    return remove('./utils/serial/build');
  },
  'serial-standalone': () => {
    log('Clean serial-standalone not implemented yet', color.yellow);
    return true;
  },
  'firmware': () => {
    return remove('./firmware/src/config/config.cpp')
         & remove('./firmware/include/config/config.hpp')
         & platformio('clean');
  }
};

function clean(target) {
  if (target === undefined) {
    return clean('framework')
         & clean('firmware');
  }

  if (!cleanHandlers.hasOwnProperty(target)) {
    log(`Invalid clean target ${target}`, color.red);
    return false;
  }

  log(`Cleaning ${target}`, color.green);
  const result = cleanHandlers[target]();
  if (result) {
    log(`Cleaning ${target} successful`, color.green);
  } else {
    log(`Cleaning ${target} failed`, color.red);
  }
  return result;
}

function config(target) {
  if (target === undefined) {
    target = 'fiona';
  }
  log(`Generating config ${target}`, color.green);
  return exec('node', ['utils/scripts/generateHardwareConfig.js', target]);
}

function platformio(command) {
  if (command == 'build' || command === undefined) {
    command = '.';
  }


  log(`Running platformio ${command}`, color.green);
  return exec(platformioExec, ['run', '-d firmware', `-t ${command}`]);
}

function plotter() {
  return exec('http-server', ['utils/plotter/']);
}

function docs() {
  log(`Building docs`, color.green);
  return exec('node', ['utils/scripts/docs.js']);
}

function unity() {
  if (process.platform == 'win32') {
    return exec('utils\\serial\\unity\\win.bat');
  } else if (process.platform == 'darwin') {
    const unityDir = './utils/serial/unity/';
    return exec(unityDir+'mac.sh');
  } else {
    return exec('echo "Linux is not supported for building unity framework."');
  }
}

const handlers = {
  'build': build,
  'clean': clean,
  'config': config,
  'platformio': platformio,
  'plotter': plotter,
  'docs': docs,
  'unity': unity
};

const platformioDir = os.homedir() + '/.platformio';
const xtensaUtilDir = platformioDir + '/packages/toolchain-xtensa32/bin/';
const addr2linePath = path.join(xtensaUtilDir, 'xtensa-esp32-elf-addr2line');

let platformioExec;
let cppExec;
let cppDefinePrefix;
let cppArgs;
const cppDefines = [
  escape('ADDR2LINE_PATH=\"' + addr2linePath + '\"')
];

if (process.platform == 'win32') {
  platformioExec = path.join(platformioDir, '/penv/Scripts/platformio');
  cppExec = 'cl';
  cppDefinePrefix = '/D';
  cppArgs = ['/Fo:Utils\\Serial\\'];
  cppDefines.push('WINDOWS');
} else {
  if (exec('which', ['platformio'])) {
    platformioExec = 'platformio';
  } else {
    platformioExec = platformioDir + '/penv/bin/platformio';
  }
  if (process.platform == 'linux') {
    cppExec = 'g++';
    cppDefinePrefix = '-D';
    cppArgs = ['-std=c++11'];
  } else {
    cppExec = 'g++';
    cppDefinePrefix = '-D';
    cppArgs = ['-std=c++11'];
  }
}

const command = process.argv[2];
if (!handlers.hasOwnProperty(command)) {
  log(`Unknown command ${command}`, color.red);
  process.exitCode = 1;
  return;
}

log(`=== Running ${command} ===`, color.green);
const result = handlers[command](process.argv[3]);
if (result) {
  log(`=== ${command} successful ===`, color.green);
  process.exitCode = 0;
} else {
  log(`=== ${command} failed ===`, color.red);
  process.exitCode = 1;
}
