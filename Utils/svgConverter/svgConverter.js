/* eslint-disable require-jsdoc */
const FileGenerator = require('./fileCreator.js');
const fileGenerator = new FileGenerator();
const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

class svgConverter {
  constructor(svgPath) {
    this.svgPath = svgPath;
  }

  loadWorld() {
    console.log('loading ', this.svgPath);
    fs.readFile(this.svgPath, function(err, data) {
      parser.parseString(data, function(err, result) {
        const hapticObjects = [];
        for (let j = 0; j < result.svg.g[0].rect.length; j++) {
          let found = false;
          const newObject = {collider: false, forcefield: false,
            hardStepIn: false, hardStepOut: false,
            triggerEnter: false, triggerInside: false,
            triggerLeave: false, triggerStartTouch: false,
            triggerTouch: false, triggerEndTouch: false,
            data: result.svg.g[0].rect[j].$};
          const styleValues = result.svg.g[0].rect[j].$.style.split(';');
          let strokeIndex;
          for (let i = 0; i < styleValues.length; i++) {
            if (styleValues[i].includes('stroke:')) {
              strokeIndex = i;
            }
            if (styleValues[i].includes('fill:')) {
              if ('url(#directedForcePattern)' === styleValues[i]
                  .split(':')[1]) {
                newObject.forcefield = true;
                found = true;
                console.log('forcefield', result.svg.g[0].rect[j].$.id);
                /* const patternID = styleValues[i].split(':')[1]
                .split('(')[1].split(')')[0];
                console.log(patternID);
                for(let pat = 0; pat < result.svg.defs[0]
                .pattern.length; pat++){
                }*/
              }
            }
            if (styleValues[i].includes('stroke-dasharray')) {
              const temp = styleValues[i].split(':');
              if (temp[1] === 'none') {
                const stroketype = styleValues[strokeIndex].split(':')[1];
                if (stroketype === '#000000') {
                  newObject.collider = true;
                  found = true;
                  console.log('collider', result.svg.g[0].rect[j].$.id);
                }
              } else if (temp[1] === '1.36219694, 1.36219694000000002') {
                const strokeColor = styleValues[strokeIndex].split(':')[1];
                if (strokeColor === '#00ff00') {
                  newObject.hardStepIn = true;
                  found = true;
                  console.log('hardstepin', result.svg.g[0].rect[j].$.id);
                } else if (strokeColor === '#ff0000') {
                  newObject.hardStepOut = true;
                  found = true;
                  console.log('harstepout', result.svg.g[0].rect[j].$.id);
                }
              }
            }
          }
          if (found) {
            hapticObjects.push(newObject);
          }
        }
        for (let j = 0; j < result.svg.g[0].g.length; j++) {
          let found = false;
          const newTrigger = {collider: false, forcefield: false,
            hardStepIn: false, hardStepOut: false,
            triggerEnter: false, triggerInside: false,
            triggerLeave: false, triggerStartTouch: false,
            triggerTouch: false, triggerEndTouch: false,
            data: result.svg.g[0].g[j].rect[0].$};

          const styleValues = result.svg.g[0].g[j].rect[0].$.style.split(';');
          let strokeIndex;
          for (let i = 0; i < styleValues.length; i++) {
            if (styleValues[i].includes('stroke:')) {
              strokeIndex = i;
            }
            if (styleValues[i].includes('fill:')) {
              if ('url(#directedForcePattern)' === styleValues[i]
                  .split(':')[1]) {
                newTrigger.forcefield = true;
                found = true;
                console.log('triggerforcefield',
                    result.svg.g[0].g[j].rect[0].$.id);
              }
            }
            if (styleValues[i].includes('stroke-dasharray')) {
              const temp = styleValues[i].split(':');
              if (temp[1] === 'none') {
                const stroketype = styleValues[strokeIndex].split(':')[1];
                if (stroketype === '#000000') {
                  newTrigger.collider = true;
                  found = true;
                  console.log('triggercollider',
                      result.svg.g[0].g[j].rect[0].$.id);
                }
              } else if (temp[1] === '1.36219694, 1.36219694000000002') {
                const strokeColor = styleValues[strokeIndex].split(':')[1];
                if (strokeColor === '#00ff00') {
                  newTrigger.hardStepIn = true;
                  found = true;
                  console.log('triggerhardStepIn',
                      result.svg.g[0].g[j].rect[0].$.id);
                } else if (strokeColor === '#ff0000') {
                  newTrigger.hardStepOut = true;
                  found = true;
                  console.log('triggerhardStepOut',
                      result.svg.g[0].g[j].rect[0].$.id);
                }
              }
            }
          }
          if (result.svg.g[0].g[j].text) {
            const userString = result.svg.g[0].g[j].text[0].tspan[0]._;
            if (userString.includes('|')) {
              const directionValue = userString.split('|')[0];
              switch (directionValue) {
                case '->':
                  newTrigger.triggerStartTouch = true;
                  found = true;
                  console.log('triggerStartTouch',
                      result.svg.g[0].g[j].rect[0].$.id);
                  break;
                case '<-':
                  newTrigger.triggerEndTouch = true;
                  found = true;
                  console.log('triggerEndTouch',
                      result.svg.g[0].g[j].rect[0].$.id);
                  break;
                case '':
                  newTrigger.triggerTouch = true;
                  found = true;
                  console.log('triggerTouch',
                      result.svg.g[0].g[j].rect[0].$.id);
                  break;
              }
              const sound = userString.split('|')[1];
              if (sound[0] === '"') {
                newTrigger.speech = sound.slice(1, -1);
              } else {
                newTrigger.soundfile = sound;
              }
            } else {
              const directionValue = userString.split(']')[0];
              switch (directionValue) {
                case '->[':
                  newTrigger.triggerEnter = true;
                  found = true;
                  console.log('triggerEnter',
                      result.svg.g[0].g[j].rect[0].$.id);
                  break;
                case '<-[':
                  newTrigger.triggerLeave = true;
                  found = true;
                  console.log('triggerLeave',
                      result.svg.g[0].g[j].rect[0].$.id);
                  break;
                case '[-':
                  newTrigger.triggerInside = true;
                  found = true;
                  console.log('triggerInside',
                      result.svg.g[0].g[j].rect[0].$.id);
                  break;
              }
              const sound = userString.split(']')[1];
              if (sound[0] === '"') {
                newTrigger.speech = sound.slice(1, -1);
              } else {
                newTrigger.soundfile = sound;
              }
            }
          }
          if (found) {
            hapticObjects.push(newTrigger);
          }
        }
        console.log('founnd ', hapticObjects.length, ' haptic objects');
        fileGenerator.generateFileImproved(hapticObjects);
        console.log('Generation complete.',
            'Pls run \'node ./prototype.js\' to test your level.');
      });
    });
  }
}

module.exports = svgConverter;
