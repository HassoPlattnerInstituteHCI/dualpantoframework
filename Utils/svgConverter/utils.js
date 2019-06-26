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
            result, 'directedForce')) {
          hapticObject.forcefield = true;
          found = true;
          const pattern = getPatternForID(patternID, result);
          const origin = new Vector(0, 0);
          const pointA = new Vector(0, 1);
          applyMatrix([origin], parseTransform(pattern.patternTransform));
          applyMatrix([pointA], parseTransform(pattern.patternTransform));
          const direction = pointA.difference(origin).normalized();
          hapticObject.forceDirection = direction;
        }
        if (searchForForcePattern(patternID,
            result, 'radialForce')) {
          hapticObject.polarForce = true;
          found = true;
          const pattern = getPatternForID(patternID, result);
          const middel = new Vector(0, 0);
          applyMatrix([middel], parseTransform(pattern.patternTransform));
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


const parseRect = function(hapticObject, rect, svg) {
  return parseStyle(hapticObject, rect.$.style, svg);
};


/**
 * @description parses rects
 * @param {Array} rects - Array that contains the rectangles.
 * @param {object} svg - Object that contains the svg data.
 * @return {object} - Habtic object.
 */
const parseRects = function(rects, svg) {
  // console.log('parseRects');
  // console.log({rects, svg});
  const hapticObjects = [];
  for (let i = 0; i < rects.length; i++) {
    const newObject = {collider: false, forcefield: false,
      hardStepIn: false, hardStepOut: false,
      triggerEnter: false, triggerInside: false,
      triggerLeave: false, triggerStartTouch: false,
      triggerTouch: false, triggerEndTouch: false,
      data: rects[i].$,
      polarForce: false};

    if (parseRect(newObject, rects[i], svg)) {
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
const applyMatrix = function(path, matrix) {
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

module.exports = {parseRect, parseRects, applyMatrix, parseTransform};
