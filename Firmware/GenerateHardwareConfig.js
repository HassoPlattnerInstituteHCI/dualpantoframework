// just assume the input config file is correct and we don't need this check
/* eslint-disable guard-for-in */
// also, this is just a helper script and does not need documentation
/* eslint-disable require-jsdoc */
// the template strings can't ne broken into multiple lines
/* eslint-disable max-len */
const input = require('../Hardware/'+process.argv[2]+'.json');
const fs = require('fs');
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(JSON.stringify(input)).digest();
const aggregates = {};

function insert(index, categoryName, valueName, value) {
  const aggregate = categoryName+'_'+valueName;
  if (!aggregates[aggregate]) {
    aggregates[aggregate] = [];
  }
  aggregates[aggregate][index] = value;
}

let index = 0; let pantoCount = 0;
for (const pantoName in input.pantos) {
  ++pantoCount;
  const panto = input.pantos[pantoName];
  for (const dofName in panto) {
    const dof = panto[dofName];
    for (const categoryName in dof) {
      const category = dof[categoryName];
      for (const valueName in category) {
        const value = category[valueName];
        insert(index, categoryName, valueName, value);
      }
    }
    ++index;
  }
}

function aggregate(name, valueIfUndefined = 0, map = ((x) => x)) {
  let array = aggregates[name];
  if (!array) {
    array = [];
  }
  for (let i = 0; i < index; ++i) {
    if (array[i] == undefined) {
      array[i] = valueIfUndefined;
    }
    if (array[i] instanceof Array) {
      array[i] = `{${array[i].join(', ')}}`;
    }
  }
  return array.map(map).join(', ');
}

function count(name) {
  const array = aggregates[name];
  if (!array) {
    return 0;
  }
  let count = 0;
  for (let i = 0; i < index; ++i) {
    if (array[i] != undefined) {
      count++;
    }
  }
  return count;
}

function getRangeForMotor(motor) {
  const centerX = motor.linkage.baseX;
  const centerY = motor.linkage.baseY;
  const range = motor.linkage.innerLength + motor.linkage.outerLength;
  return {
    minX: centerX - range,
    minY: centerY - range,
    maxX: centerX + range,
    maxY: centerY + range
  };
}

function getRangeForPanto(panto) {
  const left = getRangeForMotor(panto.left);
  const right = getRangeForMotor(panto.right);
  return {
    minX: Math.min(left.minX, right.minX),
    minY: Math.min(left.minY, right.minY),
    maxX: Math.max(left.maxX, right.maxX),
    maxY: Math.max(left.maxY, right.maxY)
  };
}

function getRange() {
  const upper = getRangeForPanto(input.pantos.upper);
  const lower = getRangeForPanto(input.pantos.lower);
  return {
    minX: Math.min(upper.minX, lower.minX),
    minY: Math.min(upper.minY, lower.minY),
    maxX: Math.max(upper.maxX, lower.maxX),
    maxY: Math.max(upper.maxY, lower.maxY)
  };
}

let range;
if (input.range) {
  range = input.range;
} else {
  range = getRange();
}

// calculate these now because sqrt isn't a constexpr
function getHashtableSettings() {
  const rangeX = range.maxX - range.minX;
  const rangeY = range.maxY - range.minY;
  const maxMemory = input.hashtable.memory / pantoCount;
  const sizeofVector = 12; // = sizeof(std::vector<IndexedEdge>)
  const maxCells = Math.floor(maxMemory / sizeofVector);
  const targetStepSize = Math.sqrt(rangeX * rangeY / maxCells);
  const stepsX = Math.floor(rangeX / targetStepSize);
  const stepsY = Math.floor(rangeY / targetStepSize);
  const stepSizeX = rangeX / stepsX;
  const stepSizeY = rangeY / stepsY;
  const numCells = stepsX * stepsY;
  const usedMemory = numCells * sizeofVector;

  return {
    maxMemory,
    usedMemory,
    maxCells,
    numCells,
    stepsX,
    stepsY,
    stepSizeX,
    stepSizeY,
    entries: input.hashtable.processedEntriesPerFrame
  };
}

const hashtable = getHashtableSettings();

const headerOutput =
`/*
 * This file is generated by GenerateHardwareConfig.js and ignored in git. Any changes you apply will *not* persist.
 * 
 * config.hpp contains hardware specific data like the pantograph size and the I/O pins.
 * It is generated by GenerateHardwareConfig.js using the hardware specifications found in the Hardware dir.
 * 
 * In order to avoid additional checks, unused data is rerouted to invalid pins instead of filtering all calls.
 * For the current configuration, this dummy pin is ${input.dummyPin}. Any assignments to this pin will be ignored, all reads from this pin will return 0.
 */

#pragma once

#include <Arduino.h>

const uint8_t configHash[] = {${Array.from(hash).map((x) => '0x'+('0'+(Number(x).toString(16))).slice(-2).toUpperCase()).join(', ')}};
const float opMinDist = ${input.opMinDist},
            opMaxDist = ${input.opMaxDist},
            opAngle = ${input.opAngle};
extern float forceFactor;
const uint8_t pantoCount = ${pantoCount};
const uint8_t dummyPin = ${input.dummyPin};
${input.usesSpi ? '#define LINKAGE_ENCODER_USE_SPI' : ''}
const uint32_t numberOfSpiEncoders = ${count('encoder_spiIndex')};
const float linkageBaseX[] = {
    ${aggregate('linkage_baseX')}
};
const float linkageBaseY[] = {
    ${aggregate('linkage_baseY')}
};
const float linkageInnerLength[] = {
    ${aggregate('linkage_innerLength')}
};
const float linkageOuterLength[] = {
    ${aggregate('linkage_outerLength')}
};
const uint8_t linkageHandleMount[] = {
    ${aggregate('linkage_handleMount')}
};
const float motorPowerLimit[] = {
    ${aggregate('motor_powerLimit')}
};
extern float pidFactor[${pantoCount*3}][3];
const float forceP = ${input.forcePidFactor[0]};
const float forceI = ${input.forcePidFactor[1]};
const float forceD = ${input.forcePidFactor[2]};
const float forcePidFactor[2][3] = {
  {forceP, forceI, forceD}, {forceP, forceI, forceD}
};
const uint8_t motorPwmPin[] = {
    ${aggregate('motor_pwmPin', input.dummyPin)}
};
const uint8_t motorDirAPin[] = {
    ${aggregate('motor_dirAPin', input.dummyPin)}
};
const uint8_t motorDirBPin[] = {
    ${aggregate('motor_dirBPin', input.dummyPin)}
};
const bool motorFlipped[] = {
    ${aggregate('motor_flipped')}
};
const uint8_t encoderAPin[] = {
    ${aggregate('encoder_aPin', input.dummyPin)}
};
const uint8_t encoderBPin[] = {
    ${aggregate('encoder_bPin', input.dummyPin)}
};
const uint8_t encoderIndexPin[] = {
    ${aggregate('encoder_indexPin', input.dummyPin)}
};
const uint32_t encoderSteps[] = {
    ${aggregate('encoder_steps')}
};
const uint32_t encoderSpiIndex[] = {
    ${aggregate('encoder_spiIndex', 0xffffffff)}
};
const float encoderFlipped[] = {
    ${aggregate('encoder_flipped', false, (x) => x ? -1 : 1)}
};
const float setupAngle[] = {
    ${aggregate('encoder_setup')}
};
constexpr float rangeMinX = ${range.minX};
constexpr float rangeMinY = ${range.minY};
constexpr float rangeMaxX = ${range.maxX};
constexpr float rangeMaxY = ${range.maxY};
constexpr uint32_t hashtableMaxMemory = ${hashtable.maxMemory};
constexpr uint32_t hashtableUsedMemory = ${hashtable.usedMemory};
constexpr uint32_t hashtableMaxCells = ${hashtable.maxCells};
constexpr uint32_t hashtableNumCells = ${hashtable.numCells};
constexpr uint32_t hashtableStepsX = ${hashtable.stepsX};
constexpr uint32_t hashtableStepsY = ${hashtable.stepsY};
constexpr double hashtableStepSizeX = ${hashtable.stepSizeX};
constexpr double hashtableStepSizeY = ${hashtable.stepSizeY};
constexpr double hashtableProcessedEntriesPerFrame = ${hashtable.entries};`;

console.log(headerOutput);
fs.writeFileSync('Firmware/shared/include/config.hpp', headerOutput);

const sourceOutput =
`/*
 * This file is generated by GenerateHardwareConfig.js and ignored in git. Any changes you apply will *not* persist.
 * 
 * config.cpp contains the initial values for the non-const global variables, since defining those in the header leads to linker errors.
 */

#include "config.hpp"

float forceFactor = ${input.forceFactor};
float pidFactor[${pantoCount*3}][3] = {
  ${aggregate('motor_pidFactor')}
};`;

console.log(sourceOutput);
fs.writeFileSync('Firmware/shared/lib/config.cpp', sourceOutput);
