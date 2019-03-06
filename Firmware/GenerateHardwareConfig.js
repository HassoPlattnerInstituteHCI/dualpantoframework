const input = require('../Hardware/'+process.argv[2]+'.json'),
      fs = require('fs'),
      crypto = require('crypto'),
      hash = crypto.createHash('md5').update(JSON.stringify(input)).digest(),
      aggregates = {};

function insert(index, categoryName, valueName, value) {
    const aggregate = categoryName+'_'+valueName;
    if(!aggregates[aggregate])
        aggregates[aggregate] = [];
    aggregates[aggregate][index] = value;
}

let index = 0, pantoCount = 0;
for(const pantoName in input.pantos) {
    ++pantoCount;
    const panto = input.pantos[pantoName];
    for(const dofName in panto) {
        const dof = panto[dofName];
        for(const categoryName in dof) {
            const category = dof[categoryName];
            for(const valueName in category) {
                const value = category[valueName];
                insert(index, categoryName, valueName, value);
            }
        }
        ++index;
    }
}

function aggregate(name, valueIfUndefined = 0) {
    let array = aggregates[name];
    if(!array)
        array = [];
    for(let i = 0; i < index; ++i) {
        if(array[i] == undefined)
            array[i] = valueIfUndefined;
        if(array[i] instanceof Array)
            array[i] = `{${array[i].join(', ')}}`;
    }
    return array.join(', ');
}

function count(name) {
    let array = aggregates[name];
    if(!array)
        return 0;
    let count = 0;
    for(let i = 0; i < index; ++i) {
        if(array[i] != undefined)
            count++;
    }
    return count;
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

const uint8_t configHash[] = {${Array.from(hash).map(x => '0x'+('0'+(Number(x).toString(16))).slice(-2).toUpperCase()).join(', ')}};
const float opMinDist = ${input.opMinDist},
            opMaxDist = ${input.opMaxDist},
            opAngle = ${input.opAngle};
extern float forceFactor;
const uint8_t pantoCount = ${pantoCount};
const uint8_t dummyPin = ${input.dummyPin};
${input.usesSpi ? "#define LINKAGE_ENCODER_USE_SPI" : ""}
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
    ${aggregate('encoder_spiIndex', -1)}
};
const float setupAngle[] = {
    ${aggregate('encoder_setup')}
};`;

console.log(headerOutput);
fs.writeFileSync('Firmware/' + input.firmware + '/include/config.hpp', headerOutput);

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
fs.writeFileSync('Firmware/' + input.firmware + '/lib/config.cpp', sourceOutput);
