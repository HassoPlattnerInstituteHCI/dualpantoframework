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

function aggregate(name) {
    let array = aggregates[name];
    if(!array)
        array = [];
    for(let i = 0; i < index; ++i)
        if(array[i] == undefined)
            array[i] = 0;
    return array.join(', ');
}

const output =
`const unsigned char configHash[] = {${Array.from(hash).map(x => '0x'+('0'+(Number(x).toString(16))).slice(-2).toUpperCase()).join(', ')}};
const float opMinDist = ${input.opMinDist},
            opMaxDist = ${input.opMaxDist},
            opAngle = ${input.opAngle};
float pidFactor[] = {${input.pidFactor.join(', ')}};
float forceFactor = ${input.forceFactor};
const unsigned char pantoCount = ${pantoCount};
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
const float motorPowerLimit[] = {
    ${aggregate('motor_powerLimit')}
};
const unsigned char motorPwmPin[] = {
    ${aggregate('motor_pwmPin')}
};
const unsigned char motorDirAPin[] = {
    ${aggregate('motor_dirAPin')}
};
const unsigned char motorDirBPin[] = {
    ${aggregate('motor_dirBPin')}
};
const bool motorFlipped[] = {
    ${aggregate('motor_flipped')}
};
const unsigned char encoderAPin[] = {
    ${aggregate('encoder_aPin')}
};
const unsigned char encoderBPin[] = {
    ${aggregate('encoder_bPin')}
};
const unsigned char encoderIndexPin[] = {
    ${aggregate('encoder_indexPin')}
};
const uint32_t encoderSteps[] = {
    ${aggregate('encoder_steps')}
};
float actuationAngle[] = {
    ${aggregate('encoder_setup')}
};`;

console.log(output);
fs.writeFileSync('Firmware/config.h', output);
