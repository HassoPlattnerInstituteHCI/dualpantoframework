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
              if ('none' !== styleValues[i].split(':')[1]) {
                newObject.forcefield = true;
              }
            }
            if (styleValues[i].includes('stroke-dasharray')) {
              const temp = styleValues[i].split(':');
              if (temp[1] === 'none') {
                const stroketype = styleValues[strokeIndex].split(':')[1];
                if (stroketype !== 'none') {
                  newObject.collider = true;
                }
              } else {
                const strokeColor = styleValues[strokeIndex].split(':')[1];
                if (strokeColor === '#00ff00') {
                  newObject.hardStepIn = true;
                } else {
                  newObject.hardStepOut = true;
                }
              }
            }
          }
          hapticObjects.push(newObject);
        }
        for (let j = 0; j < result.svg.g[0].g.length; j++) {
          const newTrigger = {collider: false, forcefield: false,
            hardStepIn: false, hardStepOut: false,
            triggerEnter: false, triggerInside: false,
            triggerLeave: false, triggerStartTouch: false,
            triggerTouch: false, triggerEndTouch: false,
            data: result.svg.g[0].g[j].rect[0].$};
          const userString = result.svg.g[0].g[j].text[0].tspan[0]._;
          if (userString.includes('|')) {
            const directionValue = userString.split('|')[0];
            switch (directionValue) {
              case '->':
                newTrigger.triggerStartTouch = true;
                break;
              case '<-':
                newTrigger.triggerEndTouch = true;
                break;
              default:
                newTrigger.triggerTouch = true;
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
                break;
              case '<-[':
                newTrigger.triggerInside = true;
                break;
              default:
                newTrigger.triggerLeave = true;
                break;
            }
            const sound = userString.split(']')[1];
            if (sound[0] === '"') {
              newTrigger.speech = sound.slice(1, -1);
            } else {
              newTrigger.soundfile = sound;
            }
          }
          hapticObjects.push(newTrigger);
        }
        console.log('founnd ', hapticObjects.length, ' haptic objects');
        fileGenerator.generateFileImproved(hapticObjects);
      });
    });
  }
}

module.exports = svgConverter;
