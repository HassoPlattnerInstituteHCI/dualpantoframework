'use strict';

const FileGenerator = require('./fileCreator.js');
const fileGenerator = new FileGenerator();
const Vector = require('../../lib/vector.js');
const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

/**
 * @description Class for code generation.
 */
class svgConverter {
  /**
   * @description Creates a new instance of FileCreator.
   * @param {string} svgPath - Path of the svg.
   * @param {string} studentDir - Path of the studen directory.
   */
  constructor(svgPath, studentDir) {
    this.svgPath = svgPath;
    this.studentDir = studentDir;
  }

  /**
   * @private This is an internal function.
   * @description Applies a matrix to a position.
   * @param {Vector} vector - Vector of the position.
   * @param {string} matrixString - String that contains the matrix.
   * @return {Vector} Transformed Vector.
   */
  applyMatrix(vector, matrixString) {
    let values = matrixString.split('(')[1].split(')')[0];
    values = values.split(',');
    for (let i = 0; i < values.length; i ++) {
      values[i] = parseFloat(values[i]);
    }
    const xVal = (values[0] * vector.x) + (values[2] * vector.y) + values[4];
    const yVal = (values[1] * vector.x) + (values[3] * vector.y) + values[5];
    return new Vector( xVal, yVal);
  }

  /**
   * @private This is an internal function.
   * @description Traces the svg pattern hyrachie for a specifid one.
   * @param {number} id - Id of the starting Pattern.
   * @param {object} result - The svg Object.
   * @param {string} pattern - String that contains the pattern.
   * @return {boolean} If pattern is in hyrachie or not.
   */
  searchForForcePattern(id, result, pattern) {
    let currentID = id;
    let nextID = id;
    do {
      const pattern = this.getPatternForID(nextID, result);
      if (!pattern) {
        return false;
      }
      nextID = pattern['xlink:href'];
      if (nextID) {
        nextID = nextID.split('#')[1];
      }
      currentID = pattern.id;
    } while (currentID !== pattern);
    return true;
  }

  /**
   * @private This is an internal function.
   * @description Find the pattern for an id.
   * @param {number} id - Id of the pattern.
   * @param {object} result - The svg Object.
   * @return {object} Pattern.
   */
  getPatternForID(id, result) {
    for (let pat = 0; pat < result.svg.defs[0].pattern.length; pat++) {
      if (result.svg.defs[0].pattern[pat].$.id === id) {
        return result.svg.defs[0].pattern[pat].$;
      }
    }
    return undefined;
  }

  /**
   * @private This is an internal function.
   * @description Parses the svg
   */
  loadWorld() {
    console.log('loading ', this.svgPath);
    fs.readFile(this.svgPath, function(err, data) {
      parser.parseString(data, function(err, result) {
        const hapticBoxObjects = [];
        let offset = new Vector(0, 0);
        if (result.svg.g[0].$.transform) {
          offset = new Vector(result.svg.g[0].$.transform.split('(')[1]
              .split(')')[0].split(',')[0], result.svg.g[0].$.transform
              .split('(')[1].split(')')[0].split(',')[1]);
        }
        // first level Recs
        if (result.svg.g[0].rect) {
          for (let j = 0; j < result.svg.g[0].rect.length; j++) {
            let found = false;
            const newObject = {collider: false, forcefield: false,
              hardStepIn: false, hardStepOut: false,
              triggerEnter: false, triggerInside: false,
              triggerLeave: false, triggerStartTouch: false,
              triggerTouch: false, triggerEndTouch: false,
              data: result.svg.g[0].rect[j].$,
              polarForce: false};
            const styleValues = result.svg.g[0].rect[j].$.style.split(';');
            let strokeIndex;
            for (let i = 0; i < styleValues.length; i++) {
              if (styleValues[i].includes('stroke:')) {
                strokeIndex = i;
              }
              if (styleValues[i].includes('fill:')) {
                if ('none' !== styleValues[i]
                    .split(':')[1]) {
                  const patternID = styleValues[i].split(':')[1]
                      .split('(')[1].split(')')[0].split('#')[1];
                  if (this.searchForForcePattern(patternID,
                      result, 'directedForce')) {
                    newObject.forcefield = true;
                    found = true;
                    console.log('forcefield', result.svg.g[0].rect[j].$.id);
                    const pattern = this.getPatternForID(patternID, result);
                    const origin = new Vector(0, 0);
                    const pointA = new Vector(0, 1);
                    const transformOrigin = this.applyMatrix(origin,
                        pattern.patternTransform);
                    const transformPointA = this.applyMatrix(pointA,
                        pattern.patternTransform);
                    const direction = transformPointA
                        .difference(transformOrigin).normalized();
                    newObject.forceDirection = direction;
                  }
                  if (this.searchForForcePattern(patternID,
                      result, 'radialForce')) {
                    newObject.polarForce = true;
                    found = true;
                    console.log('polarForce', result.svg.g[0].rect[j].$.id);
                    const pattern = this.getPatternForID(patternID, result);
                    const transformMiddel = this.applyMatrix(new Vector(0, 0),
                        pattern.patternTransform);
                    newObject.polarPoint = transformMiddel;
                  }
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
                } else if (temp[1].split(',').length == 2) {
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
              hapticBoxObjects.push(newObject);
            }
          }
        }
        // first level Paths
        const hapticMeshObjects = [];
        if (result.svg.g[0].path) {
          for (let j = 0; j < result.svg.g[0].path.length; j++) {
            let found = false;
            const newHapticMeshObject = {collider: false, forcefield: false,
              hardStepIn: false, hardStepOut: false,
              triggerEnter: false, triggerInside: false,
              triggerLeave: false, triggerStartTouch: false,
              triggerTouch: false, triggerEndTouch: false,
              data: result.svg.g[0].path[j].$,
              polarForce: false};
            let strokeIndex;
            const styleValues = result.svg.g[0].path[j].$.style.split(';');
            for (let i = 0; i < styleValues.length; i++) {
              if (styleValues[i].includes('stroke:')) {
                strokeIndex = i;
              }
              if (styleValues[i].includes('fill:')) {
                if ('none' !== styleValues[i]
                    .split(':')[1]) {
                  const patternID = styleValues[i].split(':')[1]
                      .split('(')[1].split(')')[0].split('#')[1];
                  if (this.searchForForcePattern(patternID,
                      result, 'directedForce')) {
                    newHapticMeshObject.forcefield = true;
                    found = true;
                    console.log('forcefield', result.svg.g[0].path[j].$.id);
                    const pattern = this.getPatternForID(patternID, result);
                    const origin = new Vector(0, 0);
                    const pointA = new Vector(0, 1);
                    const transformOrigin = this.applyMatrix(origin,
                        pattern.patternTransform);
                    const transformPointA = this.applyMatrix(pointA,
                        pattern.patternTransform);
                    const direction = transformPointA
                        .difference(transformOrigin).normalized();
                    newHapticMeshObject.forceDirection = direction;
                  }
                  if (this.searchForForcePattern(patternID,
                      result, 'radialForce')) {
                    newHapticMeshObject.polarForce = true;
                    found = true;
                    console.log('polarForce', result.svg.g[0].path[j].$.id);
                    const pattern = this.getPatternForID(patternID, result);
                    const transformMiddel = this.applyMatrix(new Vector(0, 0),
                        pattern.patternTransform);
                    newHapticMeshObject.polarPoint = transformMiddel;
                  }
                }
              }
              if (styleValues[i].includes('stroke-dasharray')) {
                const temp = styleValues[i].split(':');
                if (temp[1] === 'none') {
                  const stroketype = styleValues[strokeIndex].split(':')[1];
                  if (stroketype === '#000000') {
                    newHapticMeshObject.collider = true;
                    found = true;
                    console.log('collider', result.svg.g[0].path[j].$.id);
                  }
                } else if (temp[1].split(',').length == 2) {
                  const strokeColor = styleValues[strokeIndex].split(':')[1];
                  if (strokeColor === '#00ff00') {
                    newHapticMeshObject.hardStepIn = true;
                    found = true;
                    console.log('hardstepin', result.svg.g[0].path[j].$.id);
                  } else if (strokeColor === '#ff0000') {
                    newHapticMeshObject.hardStepOut = true;
                    found = true;
                    console.log('harstepout', result.svg.g[0].path[j].$.id);
                  }
                }
              }
            }
            if (found) {
              hapticMeshObjects.push(newHapticMeshObject);
            }
          }
        }
        // first level groups
        if (result.svg.g[0].g) {
          for (let j = 0; j < result.svg.g[0].g.length; j++) {
            let found = false;
            let newTrigger;

            // group Recs
            if (result.svg.g[0].g[j].rect) {
              newTrigger = {box: true, collider: false, forcefield: false,
                hardStepIn: false, hardStepOut: false,
                triggerEnter: false, triggerInside: false,
                triggerLeave: false, triggerStartTouch: false,
                triggerTouch: false, triggerEndTouch: false,
                data: result.svg.g[0].g[j].rect[0].$};

              const styleValues = result.svg.g[0].g[j].rect[0].$.style
                  .split(';');
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
                  } else if (temp[1].split(',').length == 2) {
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
            }
            // group paths
            if (result.svg.g[0].g[j].path) {
              newTrigger = {box: false, collider: false, forcefield: false,
                hardStepIn: false, hardStepOut: false,
                triggerEnter: false, triggerInside: false,
                triggerLeave: false, triggerStartTouch: false,
                triggerTouch: false, triggerEndTouch: false,
                data: result.svg.g[0].g[j].path[0].$};
              const styleValues = result.svg.g[0].g[j].path[0].$.style
                  .split(';');
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
                        result.svg.g[0].g[j].path[0].$.id);
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
                          result.svg.g[0].g[j].path[0].$.id);
                    }
                  } else if (temp[1].split(',').length == 2) {
                    const strokeColor = styleValues[strokeIndex].split(':')[1];
                    if (strokeColor === '#00ff00') {
                      newTrigger.hardStepIn = true;
                      found = true;
                      console.log('triggerhardStepIn',
                          result.svg.g[0].g[j].path[0].$.id);
                    } else if (strokeColor === '#ff0000') {
                      newTrigger.hardStepOut = true;
                      found = true;
                      console.log('triggerhardStepOut',
                          result.svg.g[0].g[j].path[0].$.id);
                    }
                  }
                }
              }
            }
            // group Text
            if (result.svg.g[0].g[j].text) {
              const userString = result.svg.g[0].g[j].text[0].tspan[0]._;
              if (userString.includes('|')) {
                const directionValue = userString.split('|')[0];
                console.log(userString.split('|')[0]);
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
              if (result.svg.g[0].g[j].$.hasOwnProperty('transform')) {
                if (result.svg.g[0].g[j].$.transform.split('(')[0] ===
                  'translate') {
                  newTrigger.translate = result.svg.g[0].g[j].$.transform
                      .split('(')[1].split(')')[0];
                } else if (result.svg.g[0].g[j].$.transform.split('(')[0] ===
                  'matrix') {
                  newTrigger.matrix = result.svg.g[0].g[j].$.transform;
                }
              }
              if (newTrigger.box) {
                hapticBoxObjects.push(newTrigger);
              } else if (newTrigger.box) {
                hapticMeshObjects.push(newTrigger);
              }
            }
          }
        }
        console.log('found ', hapticBoxObjects.length, ' haptic objects');
        fileGenerator.generateFile(hapticBoxObjects,
            hapticMeshObjects,
            this.studentDir, offset);
        console.log('Generation complete.',
            'File can be found at: ' + this.studentDir + '\n',
            'Run \'node ' + this.studentDir +
            '/prototype.js\' to test your level.');
      }.bind(this));
    }.bind(this));
  }
}

module.exports = svgConverter;
