/* eslint-disable require-jsdoc */
const fs = require('fs');

const components = {};

function fixName(name) {
  const first = name.slice(0, 1).toUpperCase();
  const remainder = name.slice(1, -3);
  return first + remainder;
}

const files = fs.readdirSync(__dirname);
for (const file of files) {
  if (file == 'index.js') {
    continue;
  }
  components[fixName(file)] = require('./' + file);
}

module.exports = components;
