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

module.exports = {applyMatrix, parseTransform};
