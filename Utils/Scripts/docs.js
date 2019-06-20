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

const indexBaseLevel = 1;

const indexOrder = {
  name: 'Classes',
  children: [
    {
      name: 'Infrastructure',
      children: [
        'Broker',
        'Device'
      ]
    },
    {
      name: 'Audio',
      children: [
        'Player',
        'VoiceInteraction'
      ]
    },
    {
      name: 'Haptics',
      children: [
        'HapticObject',
        {
          name: 'Components',
          children: [
            'Component',
            'Mesh',
            {
              name: 'Collider',
              children: [
                'Collider',
                'BoxCollider',
                'MeshCollider'
              ]
            },
            {
              name: 'Trigger',
              children: [
                'Trigger',
                'BoxTrigger',
                'MeshTrigger'
              ]
            },
            {
              name: 'Forcefield',
              children: [
                'Forcefield',
                'ForcefieldCallback',
                'ForcefieldSampleFunctions',
                'BoxForcefield',
                'MeshForcefield'
              ]
            },
            {
              name: 'HardStep',
              children: [
                'HardStep',
                'BoxHardStep',
                'MeshHardStep'
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Helper',
      children: [
        'Vector'
      ]
    }
  ]};

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

function buildIndexRecursive(files, indexObject, level) {
  const headerPrefix = '#'.repeat(level);
  if (typeof indexObject == 'string') {
    const file = files.filter((f) => f.name == indexObject)[0];
    const link = path.relative(docsPath, file.output);
    files.splice(files.indexOf(file), 1);
    return `${headerPrefix} [${file.name}](${link})\n`;
  } else {
    let result = `${headerPrefix} ${indexObject.name}\n`;
    for (const child of indexObject.children) {
      result += buildIndexRecursive(files, child, level + 1);
    }
    return result;
  }
}

function buildRemaining(files, level) {
  if (files.length == 0) {
    return '';
  }
  const headerPrefix = '#'.repeat(level);
  let result = `${headerPrefix} Unknown\n`;
  for (const file of files) {
    result += buildIndexRecursive(files, file.name, level + 1);
  }
  return result;
}

function buildIndex(files) {
  const copy = [...files];
  return buildIndexRecursive(copy, indexOrder, indexBaseLevel) +
    buildRemaining(copy, indexBaseLevel+ 1);
}

function document() {
  clean();
  const files = findFiles();
  for (const file of files) {
    buildDocs(file, files);
  }
  store({output: path.join(docsPath, 'index.md')}, buildIndex(files));
}

document();
