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
 * @description Translates a String to a Vector.
 * @param {string} coordsString - String that contains the vector.
 * @return {Vector} Resulting vector.
 */
const stringToVec = function(coordsString) {
  const xCords = coordsString.split(',')[0];
  const yCords = coordsString.split(',')[1];
  return new Vector(parseFloat(xCords), parseFloat(yCords), NaN);
};

const sampleCurveSegment = function(points, pos) {
  let p = points;
  while (p.length > 1) {
    const newPoints = [];
    for (let i = 0; i < p.length - 1; i++) {
      const p1 = p[i];
      const p2 = p[i+1];
      const difference = p2.difference(p1).scaled(pos);
      const newP = p1.sum(difference);
      newPoints.push(newP);
    }
    p = newPoints;
  }
  return p[0];
};

const divideCurve = function(points, startPos, endPos,
    maxError = .1, minLength = .5) {
  const start = sampleCurveSegment(points, startPos);
  const end = sampleCurveSegment(points, endPos);
  const pos = startPos + (endPos - startPos) / 2;
  const distance = end.difference(start).length();
  const interpolatedMiddle = start.sum(end.difference(start).scaled(0.5));
  const sampledMiddle = sampleCurveSegment(points, pos);
  const absError = interpolatedMiddle.difference(sampledMiddle).length();
  const relError = absError/distance;

  if (relError <= maxError || distance < minLength) {
    return [];
  }
  let curve = [];
  curve = curve.concat(divideCurve(points, startPos, pos, maxError));
  curve.push(sampledMiddle);
  curve = curve.concat(divideCurve(points, pos, endPos, maxError));
  return curve;
};

const sampleCubicCurve = function(
    start, startControl, endControl, end, maxSegmentLength = 1000) {
  let curve = [start];
  curve = curve.concat(divideCurve(
      [start, startControl, endControl, end], 0, 1));
  curve.push(end);
  return curve;
};

const addPoints = function(data, startPos, points, mode, lastControl) {
  let pos = startPos;
  switch (mode) {
    case 'h':
      points.push(new Vector(
          parseFloat(data[pos++]) + points[points.length - 1].x,
          points[points.length - 1].y));
      lastControl = points[points.length-1];
      break;
    case 'H':
      points.push(new Vector(
          parseFloat(data[pos++]),
          points[points.length - 1].y));
      lastControl = points[points.length-1];
      break;
    case 'v':
      points.push(new Vector(
          points[points.length - 1].x,
          parseFloat(data[pos++]) + points[points.length - 1].y));
      lastControl = points[points.length-1];
      break;
    case 'V':
      points.push(new Vector(
          points[points.length - 1].x,
          parseFloat(data[pos++])));
      lastControl = points[points.length-1];
      break;
    case 'l':
      const relativePoint = stringToVec(data[pos++]);
      points.push(points[points.length - 1].sum(relativePoint));
      lastControl = points[points.length-1];
      break;
    case 'L':
      points.push(stringToVec(data[pos++]));
      lastControl = points[points.length-1];
      break;
    case 'c': {
      const start = points[points.length - 1];
      const startControl = start.sum(stringToVec(data[pos++]));
      const endControl = start.sum(stringToVec(data[pos++]));
      const end = start.sum(stringToVec(data[pos++]));
      const path = sampleCubicCurve(
          start,
          startControl,
          endControl,
          end
      );
      for (let i = 1; i < path.length; i++) {
        points.push(path[i]);
      }
      lastControl = endControl;
      break;
    }
    case 'C': {
      const start = points[points.length - 1];
      const startControl = stringToVec(data[pos++]);
      const endControl = stringToVec(data[pos++]);
      const end = stringToVec(data[pos++]);
      const path = sampleCubicCurve(
          start,
          startControl,
          endControl,
          end
      );
      for (let i = 1; i < path.length; i++) {
        points.push(path[i]);
      }
      lastControl = endControl;
      break;
    }
    case 's': {
      const start = points[points.length - 1];
      const startControl = lastControl;
      const endControl = start.sum(stringToVec(data[pos++]));
      const end = start.sum(stringToVec(data[pos++]));
      const path = sampleCubicCurve(
          start,
          startControl,
          endControl,
          end
      );
      for (let i = 1; i < path.length; i++) {
        points.push(path[i]);
      }
      lastControl = endControl;
      break;
    }
    case 'S': {
      const start = points[points.length - 1];
      const startControl = lastControl;
      const endControl = stringToVec(data[pos++]);
      const end = stringToVec(data[pos++]);
      const path = sampleCubicCurve(
          start,
          startControl,
          endControl,
          end
      );
      for (let i = 1; i < path.length; i++) {
        points.push(path[i]);
      }
      lastControl = endControl;
      break;
    }
  }
  return {pos, lastControl};// pos;
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
  let lastControl;
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
      case 's':
      case 'S': {
        i++;
        const posAndLastControl = addPoints(
            spaceSplit, i, points, mode, lastControl);
        i = posAndLastControl.pos;
        lastControl = posAndLastControl.lastControl;
        lastMode = mode;
        break;
      }
      case 'z':
      case 'Z':
        i++;
        break;
      case 'm':
        i++;
        const mPoint = stringToVec(spaceSplit[i]);
        lastControl = mPoint;
        points.push(new Vector(mPoint.x, mPoint.y, mPoint.r));
        i++;
        lastMode = 'l';
        break;
      case 'M':
        i++;
        const MPoint = stringToVec(spaceSplit[i]);
        lastControl = MPoint;
        points.push(new Vector(MPoint.x, MPoint.y, MPoint.r));
        i++;
        lastMode = 'L';
        break;
      default: {
        const posAndLastControl = addPoints(
            spaceSplit, i, points, lastMode, lastControl);
        i = posAndLastControl.pos;
        lastControl = posAndLastControl.lastControl;
        break;
      }
    }
  }
  if (points[0].difference(points[points.length-1]).length() < 0.01) {
    points.pop();
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