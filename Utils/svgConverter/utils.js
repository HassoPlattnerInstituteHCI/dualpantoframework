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
  let found = false;
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
          found = true;
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
          found = true;
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
          found = true;
        }
      } else if (temp[1].split(',').length == 2) {
        const strokeColor = styleValues[strokeIndex].split(':')[1];
        if (strokeColor === '#00ff00') {
          hapticObject.hardStepIn = true;
          found = true;
        } else if (strokeColor === '#ff0000') {
          hapticObject.hardStepOut = true;
          found = true;
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
    }
  }
  return found;
};

/**
 * @description parses paths
 * @param {ObjectTypeEnum} type - Type of the objects.
 * @param {Array} objects - Array that contains the objects.
 * @param {object} svg - Object that contains the svg data.
 * @return {object} - Habtic object.
 */
const parseObjects = function(type, objects, svg) {
  const hapticObjects = [];
  for (let i = 0; i < objects.length; i++) {
    const newObject = {collider: false, forcefield: false,
      hardStepIn: false, hardStepOut: false,
      triggerEnter: false, triggerInside: false,
      triggerLeave: false, triggerStartTouch: false,
      triggerTouch: false, triggerEndTouch: false,
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
    if (parseStyle(newObject, objects[i].$.style, svg)) {
      const matrix = parseTransform(objects[i].$.transform);
      applyMatrixToObject(newObject, matrix);
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
 * @description Creates a Point for a substring of an svg path string.
 * @param {string} dataString - Substring ofs the path.
 * @param {Array} points - Points that have already been generated.
 * @param {string} mode - Specific mode how to interprete the string data.
 * @return {Array} Array containing the vectors.
 */
const createPoint = function(dataString, points, mode) {
  switch (mode) {
    case 'h':
      return new Vector(parseFloat(dataString) + points[points.length - 1].x,
          points[points.length - 1].y, NaN);
      break;
    case 'H':
      return new Vector(parseFloat(dataString),
          points[points.length - 1].y, NaN);
      break;
    case 'v':
      return new Vector(points[points.length - 1].x,
          parseFloat(dataString) + points[points.length - 1].y, NaN);
      break;
    case 'V':
      return new Vector(points[points.length - 1].x,
          parseFloat(dataString), NaN);
      break;
    case 'l':
      const relativePoint = stringToVec(dataString);
      return new Vector(relativePoint.x + points[points.length - 1].x,
          points[points.length - 1].y + relativePoint.y, NaN);
      break;
    case 'L':
      const lPoint = stringToVec(dataString);
      return new Vector(lPoint.x,
          lPoint.y, lPoint.r);
      break;
  }
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

/**
 * @private This is an internal function.
 * @description Parses an path string to multiple vectors.
 * @param {string} data - String that contains the path.
 * @return {Array} Array containing the vectors.
 */
const parsePathData = function(data) {
  const svgString = data.d;
  let lastMode;
  const spaceSplit = svgString.split(' ');
  const points = [];
  for (let i = 0; i < spaceSplit.length; i++) {
    switch (spaceSplit[i]) {
      case 'h':
        i++;
        points.push(createPoint(spaceSplit[i], points,
            spaceSplit[i -1]));
        lastMode = 'h';
        break;
      case 'H':
        i++;
        points.push(createPoint(spaceSplit[i], points,
            spaceSplit[i -1]));
        lastMode = 'H';
        break;
      case 'z':
      case 'Z':
        // points.push(points[0]);
        break;
      case 'm':
        lastMode = 'l';
        i++;
        const mPoint = stringToVec(spaceSplit[i]);
        points.push(new Vector(mPoint.x, mPoint.y, mPoint.r));
        break;
      case 'M':
        lastMode = 'L';
        i++;
        const MPoint = stringToVec(spaceSplit[i]);
        points.push(new Vector(MPoint.x, MPoint.y, MPoint.r));
        break;
      case 'v':
        i++;
        points.push(createPoint(spaceSplit[i], points,
            spaceSplit[i -1]));
        lastMode = 'v';
        break;
      case 'V':
        i++;
        points.push(createPoint(spaceSplit[i], points,
            spaceSplit[i -1]));
        lastMode = 'V';
        break;
      case 'l':
        i++;
        points.push(createPoint(spaceSplit[i], points,
            spaceSplit[i -1]));
        lastMode = 'l';
        break;
      case 'L':
        i++;
        points.push(createPoint(spaceSplit[i], points,
            spaceSplit[i -1]));
        lastMode = 'L';
        break;
      default:
        points.push(createPoint(spaceSplit[i], points,
            lastMode));
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
