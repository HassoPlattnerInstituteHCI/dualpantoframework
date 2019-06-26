'use strict';

const FileGenerator = require('./fileCreator.js');
const {
  parseRect, parseRects,
  parsePath, parsePaths,
  parseTransform} = require('./utils.js');
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
    this.offset = new Vector(0, 0);
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
   * @description Parses Groups
   * @param {Array} groupObjects - An array containing the groups.
   * @param {object} result - The svg as object.
   * @return {object} - Object containing two Arrays with found objects.
   */
  loadGroups(groupObjects, result) {
    const boxes = [];
    const meshes = [];
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

        if (parseRect(newTrigger, result.svg.g[0].g[j].rect[0], result.svg)) {
          found = true;
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
        // TODO: this should handle multiple paths
        if (parsePath(newTrigger, result.svg.g[0].g[j].path[0], result.svg)) {
          found = true;
        }
      }
      // group Text
      if (result.svg.g[0].g[j].text) {
        let userString;
        for (let i = 0; i < result.svg.g[0].g[j].text.length; i++) {
          const textStyle = result.svg.g[0].g[j].text[i].$.style
              .split(';');
          let color;
          for (let k = 0; k < textStyle.length; k++) {
            if (textStyle[k].includes('fill')) {
              color = textStyle[k].split(':')[1];
              break;
            }
          }
          if (color == '#000000') {
            userString = result.svg.g[0].g[j].text[i].tspan[0]._;
            break;
          }
        }
        if (userString && userString.includes('|')) {
          const directionValue = userString.split('|')[0];
          switch (directionValue) {
            case '->':
              newTrigger.triggerStartTouch = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerStartTouch',
                    result.svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerStartTouch',
                    result.svg.g[0].g[j].path[0].$.id);
              }

              break;
            case '<-':
              newTrigger.triggerEndTouch = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerEndTouch',
                    result.svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerEndTouch',
                    result.svg.g[0].g[j].path[0].$.id);
              }
              break;
            case '':
              newTrigger.triggerTouch = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerTouch',
                    result.svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerTouch',
                    result.svg.g[0].g[j].path[0].$.id);
              }
              break;
          }
          const sound = userString.split('|')[1];
          if (sound[0] === '"') {
            newTrigger.speech = sound.slice(1, -1);
          } else {
            newTrigger.soundfile = sound;
          }
        } else if (userString) {
          const directionValue = userString.split(']')[0];
          switch (directionValue) {
            case '->[':
              newTrigger.triggerEnter = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerEnter',
                    result.svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerEnter',
                    result.svg.g[0].g[j].path[0].$.id);
              }
              break;
            case '<-[':
              newTrigger.triggerLeave = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerLeave',
                    result.svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerLeave',
                    result.svg.g[0].g[j].path[0].$.id);
              }
              break;
            case '[-':
              newTrigger.triggerInside = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerInside',
                    result.svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerInside',
                    result.svg.g[0].g[j].path[0].$.id);
              }
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
          newTrigger.matrix = parseTransform(result.svg.g[0].g[j].$.transform);
        }
        // could be undefined and therefore check for true must happen
        if (newTrigger.box === true) {
          boxes.push(newTrigger);
        } else if (newTrigger.box === false) {
          meshes.push(newTrigger);
        }
      }
    }
    return {hapticBoxes: boxes, hapticMeshes: meshes};
  }

  /**
   * @private This is an internal function.
   * @description Parses the svg.
   */
  loadWorld() {
    console.log('loading ', this.svgPath);
    fs.readFile(this.svgPath, function(err, data) {
      parser.parseString(data, function(err, result) {
        const svg = result.svg;
        let hapticBoxObjects = [];
        if (result.svg.g[0].$.transform) {
          this.offset = new Vector(
              parseFloat(result.svg.g[0].$.transform.split('(')[1]
                  .split(')')[0].split(',')[0]),
              parseFloat(result.svg.g[0].$.transform
                  .split('(')[1].split(')')[0].split(',')[1]));
        }
        // first level Recs
        if (result.svg.g[0].rect) {
          hapticBoxObjects = parseRects(result.svg.g[0].rect, svg);
        }
        // first level Paths
        let hapticMeshObjects = [];
        if (result.svg.g[0].path) {
          hapticMeshObjects = parsePaths(result.svg.g[0].path, svg);
        }
        // first level groups
        if (result.svg.g[0].g) {
          const groupedObjects = this.loadGroups(result.svg.g[0].g, result);
          hapticBoxObjects = hapticBoxObjects
              .concat(groupedObjects.hapticBoxes);
          hapticMeshObjects = hapticMeshObjects
              .concat(groupedObjects.hapticMeshes);
        }
        console.log('found ', hapticBoxObjects.length +
          hapticMeshObjects.length, ' haptic objects');
        fileGenerator.generateFile(hapticBoxObjects,
            hapticMeshObjects,
            this.studentDir, this.offset);
        console.log('Generation complete.',
            'File can be found at: ' + this.studentDir + '\n',
            'Run \'node ' + this.studentDir +
            '/prototype.js\' to test your level.');
      }.bind(this));
    }.bind(this));
  }
}

module.exports = svgConverter;
