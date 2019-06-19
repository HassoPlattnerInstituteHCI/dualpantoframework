/* eslint-disable require-jsdoc */
'use strict';

const fs = require('fs');
const documentation = require('documentation');
const path = require('path');
const {remove} = require('./tools');

const sourcePath = './lib';
const docsPath = './documentation/classes';

const ignore = [
  'Dualpantoframework',
  'HandleMovement',
  'Index'
];

function clean() {
  remove(docsPath);
}

function fixName(file) {
  const name = path.parse(file).base;
  const camelCase = name.replace(/-.{1}/g, (s) => s.slice(1).toUpperCase());
  const first = camelCase.slice(0, 1).toUpperCase();
  const remainder = camelCase.slice(1, -3);
  return first + remainder;
}

function readDirRecursive(dir) {
  const results = [];
  const content = fs.readdirSync(dir);
  for (const entry in content) {
    if (content.hasOwnProperty(entry)) {
      const child = path.join(dir, content[entry]);
      if (fs.statSync(child).isDirectory()) {
        results.push(...readDirRecursive(child));
      } else {
        results.push({
          name: fixName(child),
          path: fs.realpathSync(child),
          output: path.join(
              process.cwd(),
              docsPath,
              child.replace('lib', '').replace('js', 'md'))
        });
      }
    }
  }
  return results.filter((f) => !ignore.includes(f.name));
}

function findFiles() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Can't find sources at ${fs.realpathSync(sourcePath)}`);
  }
  return readDirRecursive(sourcePath);
}

function replaceLinks(file, content, files) {
  let replaced = content;
  for (const other of files) {
    if (file == other) {
      continue;
    }
    replaced = replaced.replace(
        new RegExp(`\\b${other.name}\\b`, 'g'),
        `[$&](${path.relative(path.parse(file.output).dir, other.output)})`);
  }
  return replaced;
}

function store(file, content) {
  const dir = path.parse(file.output).dir;
  fs.mkdir(
      dir,
      {recursive: true},
      () =>
        fs.writeFile(
            file.output,
            content,
            () =>
              console.log(`built docs for ${file.name}`))
  );
}

function buildDocs(file, files) {
  documentation
      .build( [file.path], {
        shallow: true
      })
      .then(documentation.formats.md)
      .then((content) => {
        const replaced = replaceLinks(file, content, files);
        store(file, replaced);
      });
}

function document() {
  clean();
  const files = findFiles();
  for (const file of files) {
    buildDocs(file, files);
  }
}

document();
