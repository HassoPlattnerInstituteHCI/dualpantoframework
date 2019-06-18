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

        if (this.loadRect(newTrigger, result.svg.g[0].g[j].rect[0], result)) {
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
        if (this.loadPath(newTrigger, result.svg.g[0].g[j].path[0], result)) {
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
          if (result.svg.g[0].g[j].$.transform.split('(')[0] ===
            'translate') {
            console.log('has translate: ', result.svg.g[0].g[j].$
                .transform.split('(')[1].split(')')[0]);
            newTrigger.translate = result.svg.g[0].g[j].$.transform
                .split('(')[1].split(')')[0];
          } else if (result.svg.g[0].g[j].$.transform.split('(')[0] ===
            'matrix') {
            newTrigger.matrix = result.svg.g[0].g[j].$.transform;
          }
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
   * @description Parses a path.
   * @param {object} hapticObject - The object that is to be generated.
   * @param {object} pathObject - The path that is to be parsed.
   * @param {object} result - The svg as object.
   * @return {boolean} - If an object was found.
   */
  loadPath(hapticObject, pathObject, result) {
    let found = false;
    let strokeIndex;
    const styleValues = pathObject.$.style.split(';');
    let dashArrayFound = false;
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
            hapticObject.forcefield = true;
            found = true;
            console.log('forcefield', pathObject.$.id);
            const pattern = this.getPatternForID(patternID, result);
            const origin = new Vector(0, 0);
            const pointA = new Vector(0, 1);
            const transformOrigin = this.applyMatrix(origin,
                pattern.patternTransform);
            const transformPointA = this.applyMatrix(pointA,
                pattern.patternTransform);
            const direction = transformPointA
                .difference(transformOrigin).normalized();
            hapticObject.forceDirection = direction;
          }
          if (this.searchForForcePattern(patternID,
              result, 'radialForce')) {
            hapticObject.polarForce = true;
            found = true;
            console.log('polarForce', pathObject.$.id);
            const pattern = this.getPatternForID(patternID, result);
            const transformMiddel = this.applyMatrix(this.offset,
                pattern.patternTransform);
            transformMiddel.x += this.offset.x;
            transformMiddel.y += this.offset.y;
            console.log({pattern, transformMiddel});
            hapticObject.polarPoint = transformMiddel;
          }
        }
      }
      if (styleValues[i].includes('stroke-dasharray')) {
        dashArrayFound = true;
        const temp = styleValues[i].split(':');
        if (temp[1] === 'none') {
          const stroketype = styleValues[strokeIndex].split(':')[1];
          if (stroketype === '#000000') {
            hapticObject.collider = true;
            found = true;
            console.log('collider', pathObject.$.id);
          }
        } else if (temp[1].split(',').length == 2) {
          const strokeColor = styleValues[strokeIndex].split(':')[1];
          if (strokeColor === '#00ff00') {
            hapticObject.hardStepIn = true;
            found = true;
            console.log('hardstepin', pathObject.$.id);
          } else if (strokeColor === '#ff0000') {
            hapticObject.hardStepOut = true;
            found = true;
            console.log('harstepout', pathObject.$.id);
          }
        }
      }
    }
    if (!dashArrayFound) {
      if (!strokeIndex) {
        for (let index = 0; index < styleValues.length; index++) {
          if (styleValues[index].includes('stroke:')) {
            strokeIndex = index;
          }
        }
      }
      const stroketype = styleValues[strokeIndex].split(':')[1];
      if (stroketype === '#000000') {
        hapticObject.collider = true;
        found = true;
        console.log('collider', pathObject.$.id);
      }
    }
    return found;
  }

  /**
   * @private This is an internal function.
   * @description Parses paths.
   * @param {Array} pathObjects - An array containing the paths.
   * @param {object} result - The svg as object.
   * @return {Array} - The parsed Objects.
   */
  loadPaths(pathObjects, result) {
    const hapticMeshObjects = [];
    for (let j = 0; j < pathObjects.length; j++) {
      const newHapticMeshObject = {collider: false, forcefield: false,
        hardStepIn: false, hardStepOut: false,
        triggerEnter: false, triggerInside: false,
        triggerLeave: false, triggerStartTouch: false,
        triggerTouch: false, triggerEndTouch: false,
        data: pathObjects[j].$,
        polarForce: false};

      if (this.loadPath(newHapticMeshObject, pathObjects[j], result)) {
        hapticMeshObjects.push(newHapticMeshObject);
      }
    }
    return hapticMeshObjects;
  }

  /**
   * @private This is an internal function.
   * @description Parses a rect.
   * @param {object} hapticObject - The object that is to be generated.
   * @param {object} rectObject - The rectangle that is to be parsed.
   * @param {object} result - The svg as object.
   * @return {boolean} - If an object was found.
   */
  loadRect(hapticObject, rectObject, result) {
    let found = false;
    const styleValues = rectObject.$.style.split(';');
    let strokeIndex;
    let dashArrayFound = false;
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
            hapticObject.forcefield = true;
            found = true;
            console.log('forcefield', rectObject.$.id);
            const pattern = this.getPatternForID(patternID, result);
            const origin = new Vector(0, 0);
            const pointA = new Vector(0, 1);
            const transformOrigin = this.applyMatrix(origin,
                pattern.patternTransform);
            const transformPointA = this.applyMatrix(pointA,
                pattern.patternTransform);
            const direction = transformPointA
                .difference(transformOrigin).normalized();
            hapticObject.forceDirection = direction;
          }
          if (this.searchForForcePattern(patternID,
              result, 'radialForce')) {
            hapticObject.polarForce = true;
            found = true;
            console.log('polarForce', rectObject.$.id);
            const pattern = this.getPatternForID(patternID, result);
            const transformMiddel = this.applyMatrix(new Vector(0, 0),
                pattern.patternTransform);
            hapticObject.polarPoint = transformMiddel;
          }
        }
      }
      if (styleValues[i].includes('stroke-dasharray')) {
        dashArrayFound = true;
        const temp = styleValues[i].split(':');
        if (temp[1] === 'none') {
          const stroketype = styleValues[strokeIndex].split(':')[1];
          if (stroketype === '#000000') {
            hapticObject.collider = true;
            found = true;
            console.log('collider', rectObject.$.id);
          }
        } else if (temp[1].split(',').length == 2) {
          const strokeColor = styleValues[strokeIndex].split(':')[1];
          if (strokeColor === '#00ff00') {
            hapticObject.hardStepIn = true;
            found = true;
            console.log('hardstepin', rectObject.$.id);
          } else if (strokeColor === '#ff0000') {
            hapticObject.hardStepOut = true;
            found = true;
            console.log('harstepout', rectObject.$.id);
          }
        }
      }
    }
    if (!dashArrayFound) {
      if (!strokeIndex) {
        for (let index = 0; index < styleValues.length; index++) {
          if (styleValues[index].includes('stroke:')) {
            strokeIndex = index;
          }
        }
      }
      const stroketype = styleValues[strokeIndex].split(':')[1];
      if (stroketype === '#000000') {
        hapticObject.collider = true;
        found = true;
        console.log('collider', rectObject.$.id);
      }
    }
    return found;
  }

  /**
   * @private This is an internal function.
   * @description Parses rects.
   * @param {Array} rectObjects - An array containing the rectangles.
   * @param {object} result - The svg as object.
   * @return {Array} - The parsed Objects.
   */
  loadRects(rectObjects, result) {
    const hapticBoxObjects = [];
    for (let j = 0; j < rectObjects.length; j++) {
      const newObject = {collider: false, forcefield: false,
        hardStepIn: false, hardStepOut: false,
        triggerEnter: false, triggerInside: false,
        triggerLeave: false, triggerStartTouch: false,
        triggerTouch: false, triggerEndTouch: false,
        data: rectObjects[j].$,
        polarForce: false};

      if (this.loadRect(newObject, rectObjects[j], result)) {
        hapticBoxObjects.push(newObject);
      }
    }
    return hapticBoxObjects;
  }

  /**
   * @private This is an internal function.
   * @description Parses the svg.
   */
  loadWorld() {
    console.log('loading ', this.svgPath);
    fs.readFile(this.svgPath, function(err, data) {
      parser.parseString(data, function(err, result) {
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
          hapticBoxObjects = this.loadRects(result.svg.g[0].rect, result);
        }
        // first level Paths
        let hapticMeshObjects = [];
        if (result.svg.g[0].path) {
          hapticMeshObjects = this.loadPaths(result.svg.g[0].path, result);
        }
        // first level groups
        if (result.svg.g[0].g) {
          const groupedObjects = this.loadGroups(result.svg.g[0].g, result);
          hapticBoxObjects = hapticBoxObjects
              .concat(groupedObjects.hapticBoxes);
          hapticMeshObjects = hapticMeshObjects
              .concat(groupedObjects.hapticMeshes);
        }
        console.log('found ', hapticBoxObjects.length, ' haptic objects');
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
