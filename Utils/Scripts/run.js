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
    return exec('node', ['./voice-command/build/build-release.js']);
  },
  'serial-plugin': () => {
    const gypDef = '--cppdefs="NODE_GYP ' + escape(cppDefines.join(' ')) + '"';
    return exec('node-gyp', ['configure', gypDef])
         & exec('node-gyp', ['build']);
  },
  'serial-standalone': () => {
    return exec(
        cppExec,
        cppArgs.concat(cppDefines.map((d) => cppDefinePrefix + d)).concat([
          'Utils/Serial/src/standalone/main.cpp',
          'Utils/Serial/src/standalone/standalone.cpp',
          'Utils/Serial/src/serial/shared.cpp',
          'Utils/Serial/src/crashAnalyzer/analyze.cpp',
          'Utils/Serial/src/crashAnalyzer/buffer.cpp',
          process.platform == 'win32' ?
            'Utils/Serial/src/serial/win.cpp' :
            'Utils/Serial/src/serial/unix.cpp',
          'protocol/src/protocol/protocol.cpp',
          '-IUtils/Serial/include',
          '-Iprotocol/include',
          '-o Utils/Serial/serial']));
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
    return clean('voice-command')
         & clean('serial-plugin')
         & clean('serial-standalone');
  },
  'voice-command': () => {
    return remove('./voice-command/.bin');
  },
  'serial-plugin': () => {
    return remove('./build');
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
  return exec(platformioExec, ['run', '-d firmware', `-t ${command}`]);
}

function plotter() {
  return exec('http-server', ['Utils/plotter/']);
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
  'plotter': plotter,
  'docs': docs
};

const platformioDir = os.homedir() + '/.platformio';
const xtensaUtilDir = platformioDir + '/packages/toolchain-xtensa32/bin/';
const addr2linePath = path.join(xtensaUtilDir, 'xtensa-esp32-elf-addr2line');

let platformioExec;
let cppExec;
let cppDefinePrefix;
let cppArgs;
const cppDefines = [];

if (process.platform == 'win32') {
  platformioExec = path.join(platformioDir, '/penv/Scripts/platformio');
  cppExec = 'cl';
  cppDefinePrefix = '/D';
  cppArgs = ['/Fo:Utils\\Serial\\'];
  const addr2lineDefine = 'ADDR2LINE_PATH=\"' + addr2linePath + '\"';
  cppDefines.push(escape(addr2lineDefine));
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
    cppExec = 'clang++';
    cppDefinePrefix = '-D';
    cppArgs = ['-std=c++11'];
  }
  cppDefines.push('ADDR2LINE_PATH=\\\"' + addr2linePath + '\\\"');
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
