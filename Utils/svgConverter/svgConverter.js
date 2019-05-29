/* eslint-disable require-jsdoc */
const FileGenerator = require('./fileCreator.js');
const fileGenerator = new FileGenerator();
const Vector = require('../../lib/vector.js');
const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();


class svgConverter {
  constructor(svgPath, studentDir) {
    this.svgPath = svgPath;
    this.studentDir = studentDir;
  }

  applyMatrix(vector, MatrixString) {
    let values = MatrixString.split('(')[1].split(')')[0];
    values = values.split(',');
    for (let i = 0; i < values.length; i ++) {
      values[i] = parseFloat(values[i]);
    }
    const xVal = (values[0] * vector.x) + (values[2] * vector.y) + values[4];
    const yVal = (values[1] * vector.x) + (values[3] * vector.y) + values[5];
    return new Vector( xVal, yVal);
  }

  searchForPattern(id, result) {
    const patternstack = [];
    let currentID = id;
    let nextID = id;
    do {
      const pattern = this.getPatternForID(nextID, result);
      nextID = pattern['xlink:href'];
      if (nextID) {
        nextID = nextID.split('#')[1];
      }
      currentID = pattern.id;
      patternstack.push(pattern);
    } while (currentID !== 'patternForce');
    return patternstack;
  }

  getPatternForID(id, result) {
    for (let pat = 0; pat < result.svg.defs[0].pattern.length; pat++) {
      if (result.svg.defs[0].pattern[pat].$.id === id) {
        return result.svg.defs[0].pattern[pat].$;
      }
    }
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
                const patternID = styleValues[i].split(':')[1]
                    .split('(')[1].split(')')[0].split('#')[1];
                const pattern = this.getPatternForID(patternID, result);
                const origin = new Vector(0, 0);
                const pointA = new Vector(0, 1);
                const transformOrigin = this.applyMatrix(origin,
                    pattern.patternTransform);
                const transformPointA = this.applyMatrix(pointA,
                    pattern.patternTransform);
                const direction = transformPointA.difference(transformOrigin)
                    .normalized();
                newObject.forceDirection = direction;
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
        if (result.svg.g[0].g) {
          for (let j = 0; j < result.svg.g[0].g.length; j++) {
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
                if ('none' !== styleValues[i].split(':')[1]) {
                  newTrigger.forcefield = true;
                }
              }
              if (styleValues[i].includes('stroke-dasharray')) {
                const temp = styleValues[i].split(':');
                if (temp[1] === 'none') {
                  const stroketype = styleValues[strokeIndex].split(':')[1];
                  if (stroketype !== 'none') {
                    newTrigger.collider = true;
                  }
                } else {
                  const strokeColor = styleValues[strokeIndex].split(':')[1];
                  if (strokeColor === '#00ff00') {
                    newTrigger.hardStepIn = true;
                  } else {
                    newTrigger.hardStepOut = true;
                  }
                }
              }
            }

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
                  newTrigger.triggerLeave = true;
                  break;
                default:
                  newTrigger.triggerInside = true;
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
        }
        console.log('found ', hapticObjects.length, ' haptic objects');
        fileGenerator.generateFileImproved(hapticObjects, this.studentDir);
        console.log('Generation complete.',
            'File can be found at: ' + this.studentDir + '\n',
            'Run \'node ' + this.studentDir +
            '/prototype.js\' to test your level.');
      }.bind(this));
    }.bind(this));
  }
}

module.exports = svgConverter;
