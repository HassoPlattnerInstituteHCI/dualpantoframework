/* eslint-disable require-jsdoc */
'use strict';

const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');

const color = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function exec(cmd, args) {
  return childProcess.spawnSync(
      cmd,
      args,
      {
        shell: true,
        stdio: ['ignore', process.stdout, process.stderr]
      }).status == 0;
};

function remove(target) {
  if (!fs.existsSync(target)) {
    console.log(`Could not find ${target}`, color.yellow);
    return true;
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
  return true;
}

function escape(string) {
  return string.replace(/\\/g, '\\\\').replace(/"/g, '\\\"');
}

module.exports = {
  exec,
  remove,
  color,
  escape
};
