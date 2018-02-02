const input = require('./Hardware/'+process.argv[2]+'.json'),
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

const output =
`const unsigned char configHash[] = {${Array.from(hash).map(x => '0x'+('0'+(Number(x).toString(16))).slice(-2).toUpperCase()).join(', ')}};
const float baseDist = ${input.baseDist},
            innerDist = ${input.innerDist},
            outerDist = ${input.outerDist},
            opMinDist = ${input.opMinDist},
            opMaxDist = ${input.opMaxDist},
            opAngle = ${input.opAngle},
            powerLimit = ${input.powerLimit};
const unsigned char pantoCount = ${pantoCount};
const unsigned char dofCount = ${aggregates['encoder_steps'].length};
const unsigned char motorPwmPin[] = {
    ${aggregates['motor_pwmPin'].join(', ')}
};
const unsigned char motorDirPin[] = {
    ${aggregates['motor_dirPin'].join(', ')}
};
const bool motorFlipped[] = {
    ${aggregates['motor_flipped'].join(', ')}
};
const unsigned char encoderAPin[] = {
    ${aggregates['encoder_aPin'].join(', ')}
};
const unsigned char encoderBPin[] = {
    ${aggregates['encoder_bPin'].join(', ')}
};
const bool encoderFlipped[] = {
    ${aggregates['encoder_flipped'].join(', ')}
};
const uint32_t encoderSteps[] = {
    ${aggregates['encoder_steps'].join(', ')}
};
float actuationAngle[] = {
    ${aggregates['encoder_setup'].join(', ')}
};`;

/*const unsigned char encoderIndexPin[] = {
    ${aggregates['encoder_indexPin'].join(', ')}
};*/

console.log(output);
fs.writeFileSync('Firmware/config.h', output);
