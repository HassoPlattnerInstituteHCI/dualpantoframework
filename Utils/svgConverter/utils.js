const Vector = require('./../../lib/vector.js');

const ObjectTypeEnum = Object.freeze({'path': 1, 'rect': 2});

/**
 * @private This is an internal function.
 * @description Find the pattern for an id.
 * @param {number} id - Id of the pattern.
 * @param {object} svg - The svg Object.
 * @return {object} Pattern.
 */
const getPatternForID = function(id, svg) {
  for (let pat = 0; pat < svg.defs[0].pattern.length; pat++) {
    if (svg.defs[0].pattern[pat].$.id === id) {
      return svg.defs[0].pattern[pat].$;
    }
  }
  return undefined;
};

/**
 * @private This is an internal function.
 * @description Traces the svg pattern hyrachie for a specifid one.
 * @param {number} id - Id of the starting Pattern.
 * @param {object} svg - The svg Object.
 * @param {string} pattern - String that contains the pattern.
 * @return {boolean} If pattern is in hyrachie or not.
 */
const searchForForcePattern = function(id, svg, pattern) {
  let currentID = id;
  let nextID = id;
  do {
    const pattern = getPatternForID(nextID, svg);
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
};

const parseStyle = function(hapticObject, style, svg) {
  // console.log({func: 'parseStyle', hapticObject, style});
  const styleValues = style.split(';');
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
        if (searchForForcePattern(patternID,
            svg, 'directedForce')) {
          hapticObject.forcefield = true;
          hapticObject.commentOnly = false;
          const pattern = getPatternForID(patternID, svg);
          const origin = new Vector(0, 0);
          const up = new Vector(0, 1);
          applyMatrixToPoints(
              [origin], parseTransform(pattern.patternTransform));
          applyMatrixToPoints(
              [up], parseTransform(pattern.patternTransform));
          hapticObject.directedForce = {origin, up};
        }
        if (searchForForcePattern(patternID,
            svg, 'radialForce')) {
          hapticObject.polarForce = true;
          hapticObject.commentOnly = false;
          const pattern = getPatternForID(patternID, svg);
          const middle = new Vector(0, 0);
          applyMatrixToPoints(
              [middle], parseTransform(pattern.patternTransform));
          hapticObject.polarPoint = middle;
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
          hapticObject.commentOnly = false;
        }
      } else if (temp[1].split(',').length == 2) {
        const strokeColor = styleValues[strokeIndex].split(':')[1];
        if (strokeColor === '#00ff00') {
          hapticObject.hardStepIn = true;
          hapticObject.commentOnly = false;
        } else if (strokeColor === '#ff0000') {
          hapticObject.hardStepOut = true;
          hapticObject.commentOnly = false;
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
      hapticObject.commentOnly = false;
    }
  }
};

const parseObjects = function(type, objects, svg, includeComments = false) {
  const hapticObjects = [];
  for (let i = 0; i < objects.length; i++) {
    const newObject = {collider: false, forcefield: false,
      hardStepIn: false, hardStepOut: false,
      triggerEnter: false, triggerInside: false,
      triggerLeave: false, triggerStartTouch: false,
      triggerTouch: false, triggerEndTouch: false,
      commentOnly: true,
      id: objects[i].$.id,
      polarForce: false};
    switch (type) {
      case ObjectTypeEnum.path:
        newObject.points = parsePathData(objects[i].$);
        break;
      case ObjectTypeEnum.rect:
        newObject.points = parseRectData(objects[i].$);
        break;
      default:
        newObject.points = [];
    }
    parseStyle(newObject, objects[i].$.style, svg);
    const matrix = parseTransform(objects[i].$.transform);
    applyMatrixToObject(newObject, matrix);
    if (includeComments || !newObject.commentOnly) {
      hapticObjects.push(newObject);
    }
  }
  return hapticObjects;
};

/**
 * @private This is an internal function.
 * @description Applies a matrix to a path.
 * @param {Array} path - Array that contains 2D points.
 * @param {number[]} matrix - Array that contains the matrix.
 */
const applyMatrixToPoints = function(path, matrix) {
  for (let j = 0; j < path.length; j++) {
    const position = path[j];
    for (let i = 0; i < matrix.length; i ++) {
      matrix[i] = parseFloat(matrix[i]);
    }
    const xVal = (matrix[0] * position.x) + (matrix[2] * position.y)
    + matrix[4];
    const yVal = (matrix[1] * position.x) + (matrix[3] * position.y)
    + matrix[5];
    position.x = xVal;
    position.y = yVal;
  }
};

const applyMatrixToObject = function(object, matrix) {
  applyMatrixToPoints(object.points, matrix);
  if (object.polarPoint) {
    applyMatrixToPoints([object.polarPoint], matrix);
  }
  if (object.directedForce) {
    applyMatrixToPoints([object.directedForce.origin], matrix);
    applyMatrixToPoints([object.directedForce.up], matrix);
  }
};

/**
 * @private This is an internal function.
 * @description Tranlates a SVG transform to a matrix.
 * @param {string} transform - String that contains the transform.
 * @return {number[]} Array that contains the matrix.
 */
const parseTransform = function(transform) {
  if (!transform || !transform.includes('(')) {
    return [1, 0, 0, 1, 0, 0];
  }
  const type = transform.split('(')[0];
  const values = transform.split('(')[1].split(')')[0];
  switch (type) {
    case 'scale': {
      const scales = values.split(',');
      return [scales[0], 0, 0, scales[1], 0, 0];
    }
      break;
    case 'translate': {
      const translates = values.split(',');
      return [1, 0, 0, 1, translates[0], translates[1]];
    }
      break;
    case 'rotate': {
      const angleAndPivot = values.split(',');
      const angle = (parseFloat(angleAndPivot[0]) / 180) * Math.PI;
      const pivotX = parseFloat(angleAndPivot[1] || 0);
      const pivotY = parseFloat(angleAndPivot[2] || 0);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      return [cosA, sinA, -sinA, cosA,
        -pivotX * cosA + pivotY * sinA + pivotX,
        -pivotX * sinA - pivotY * cosA + pivotY];
    }
      break;
    case 'matrix': {
      return values.split(',');
    }
      break;
    default:
      break;
  }
  return [1, 0, 0, 1, 0, 0];
};

/**
 * @private This is an internal function.
 * @description Tranlates a String to a Vector.
 * @param {string} cordsString - String that contains the vector.
 * @return {Vector} Resulting vector.
 */
const stringToVec = function(cordsString) {
  const xCords = cordsString.split(',')[0];
  const yCords = cordsString.split(',')[1];
  return new Vector(parseFloat(xCords), parseFloat(yCords), NaN);
};

const sampleCubicCurve = function(
    start, startControl, endControl, end, maxSegmentLength = 1000) {
  // TODO sampling
  return [start, end];
};

const addPoints = function(data, startPos, points, mode) {
  let pos = startPos;
  switch (mode) {
    case 'h':
      points.push(new Vector(
          parseFloat(data[pos++]) + points[points.length - 1].x,
          points[points.length - 1].y));
      break;
    case 'H':
      points.push(new Vector(
          parseFloat(data[pos++]),
          points[points.length - 1].y));
      break;
    case 'v':
      points.push(new Vector(
          points[points.length - 1].x,
          parseFloat(data[pos++]) + points[points.length - 1].y));
      break;
    case 'V':
      points.push(new Vector(
          points[points.length - 1].x,
          parseFloat(data[pos++])));
      break;
    case 'l':
      const relativePoint = stringToVec(data[pos++]);
      points.push(points[points.length - 1].sum(relativePoint));
      break;
    case 'L':
      points.push(stringToVec(data[pos++]));
      break;
    case 'c': {
      const start = points[points.length - 1];
      const path = sampleCubicCurve(
          start,
          start.sum(stringToVec(data[pos++])),
          start.sum(stringToVec(data[pos++])),
          start.sum(stringToVec(data[pos++]))
      );
      for (let i = 1; i < path.length; i++) {
        points.push(path[i]);
      }
      break;
    }
    case 'C': {
      const start = points[points.length - 1];
      const path = sampleCubicCurve(
          start,
          stringToVec(data[pos++]),
          stringToVec(data[pos++]),
          stringToVec(data[pos++])
      );
      for (let i = 1; i < path.length; i++) {
        points.push(path[i]);
      }
      break;
    }
  }
  return pos;
};

/**
 * @private This is an internal function.
 * @description Parses an path string to multiple vectors.
 * @param {string} data - String that contains the path.
 * @return {Array} Array containing the vectors.
 */
const parsePathData = function(data) {
  let lastMode;
  const spaceSplit = data.d.split(' ');
  const points = [];
  for (let i = 0; i < spaceSplit.length; ) {
    const mode = spaceSplit[i];
    switch (mode) {
      case 'h':
      case 'H':
      case 'v':
      case 'V':
      case 'l':
      case 'L':
      case 'c':
      case 'C':
        i++;
        i = addPoints(spaceSplit, i, points, mode);
        lastMode = mode;
        break;
      case 'z':
      case 'Z':
        i++;
        break;
      case 'm':
        i++;
        const mPoint = stringToVec(spaceSplit[i]);
        points.push(new Vector(mPoint.x, mPoint.y, mPoint.r));
        i++;
        lastMode = 'l';
        break;
      case 'M':
        i++;
        const MPoint = stringToVec(spaceSplit[i]);
        points.push(new Vector(MPoint.x, MPoint.y, MPoint.r));
        i++;
        lastMode = 'L';
        break;
      default:
        i = addPoints(spaceSplit, i, points, lastMode);
        break;
    }
  }
  return points;
};

/**
 * @private This is an internal function.
 * @description Parses an path string to multiple vectors.
 * @param {string} data - String that contains the path.
 * @return {Array} Array containing the vectors.
 */
const parseRectData = function(data) {
  const x = parseFloat(data.x);
  const y = parseFloat(data.y);
  const width = parseFloat(data.width);
  const height = parseFloat(data.height);
  const points = [
    new Vector(x, y),
    new Vector(x, y + height),
    new Vector(x + width, y + height),
    new Vector(x + width, y)
  ];
  return points;
};

module.exports = {
  ObjectTypeEnum, parseObjects, applyMatrixToObject, parseTransform};
