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
    minX: Math.min(left.min.x, right.min.x),
    minY: Math.min(left.min.y, right.min.y),
    maxX: Math.max(left.max.x, right.max.x),
    maxY: Math.max(left.max.y, right.max.y)
  };
}

function getRange() {
  const upper = getRangeForPanto(input.upper);
  const lower = getRangeForPanto(input.lower);
  return {
    minX: Math.min(upper.min.x, lower.min.x),
    minY: Math.min(upper.min.y, lower.min.y),
    maxX: Math.max(upper.max.x, lower.max.x),
    maxY: Math.max(upper.max.y, lower.max.y)
  };
}

let range;
if (typeof input.range !== 'undefined') {
  range = input.range;
} else {
  range = getRange();
}

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
const char linkageHandleMount[] = {
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
constexpr float rangeMaxY = ${range.maxY};`;

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
