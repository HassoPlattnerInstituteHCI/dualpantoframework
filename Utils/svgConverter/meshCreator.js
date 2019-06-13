const Vector = require('./../../lib/vector.js');

/**
 * @description Class for path translation.
 */
class MeshCreator {
  /**
   * @description Creates a new instance of FileCreator.
   * @param {number} [svgTranformxOffset= 0] - X offset if given.
   * @param {number} [svgTranformyOffset= 0] - Y offset if given.
   */
  constructor(svgTranformxOffset = 0,
      svgTranformyOffset = 0) {
    this.svgTranformxOffset = parseFloat(svgTranformxOffset);
    this.svgTranformyOffset = parseFloat(svgTranformyOffset);
  }

  /**
   * @private This is an internal function.
   * @description Tranlates a String to a Vector.
   * @param {string} cordsString - String that contains the vector.
   * @return {Vector} Resulting vector.
   */
  stringToVec(cordsString) {
    const xCords = cordsString.split(',')[0];
    const yCords = cordsString.split(',')[1];
    return new Vector(parseFloat(xCords), parseFloat(yCords), NaN);
  }

  /**
   * @private This is an internal function.
   * @description Applies a matrix to a path.
   * @param {Array} path - Array that contains 2D points.
   * @param {number[]} matrix - Array that contains the matrix.
   */
  applyMatrix(path, matrix) {
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
  }

  /**
   * @private This is an internal function.
   * @description Tranlates a SVG transform to a matrix.
   * @param {string} transform - String that contains the transform.
   * @return {number[]} Array that contains the matrix.
   */
  parseTransform(transform) {
    console.log(transform);
    if (!transform || !transform.includes('(')) {
      return [1, 0, 0, 1, 0, 0];
    }
    const type = transform.split('(')[0];
    const values = transform.split('(')[1].split(')')[0];
    console.log(values);
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
        const angle = (parseFloat(values) / 180) * Math.PI;
        return [Math.cos(angle), Math.sin(angle),
          -Math.sin(angle), Math.cos(angle), 0, 0];
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
  }

  /**
   * @private This is an internal function.
   * @description Parses an path string to multiple vectors.
   * @param {string} data - String that contains the path.
   * @return {Array} Array containing the vectors.
   */
  parseSvgPath(data) {
    const svgString = data.d;
    const transform = data.transform;
    const matrix = this.parseTransform(transform);
    let lastMode;
    const spaceSplit = svgString.split(' ');
    const points = [];
    for (let i = 0; i < spaceSplit.length; i++) {
      switch (spaceSplit[i]) {
        case 'h':
          i++;
          points.push(this.createPoint(spaceSplit[i], points,
              spaceSplit[i -1]));
          lastMode = 'h';
          break;
        case 'H':
          i++;
          points.push(this.createPoint(spaceSplit[i], points,
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
          const mPoint = this.stringToVec(spaceSplit[i]);
          points.push(new Vector(mPoint.x, mPoint.y, mPoint.r));
          break;
        case 'M':
          lastMode = 'L';
          i++;
          const MPoint = this.stringToVec(spaceSplit[i]);
          points.push(new Vector(MPoint.x, MPoint.y, MPoint.r));
          break;
        case 'v':
          i++;
          points.push(this.createPoint(spaceSplit[i], points,
              spaceSplit[i -1]));
          lastMode = 'v';
          break;
        case 'V':
          i++;
          points.push(this.createPoint(spaceSplit[i], points,
              spaceSplit[i -1]));
          lastMode = 'V';
          break;
        case 'l':
          i++;
          points.push(this.createPoint(spaceSplit[i], points,
              spaceSplit[i -1]));
          lastMode = 'l';
          break;
        case 'L':
          i++;
          points.push(this.createPoint(spaceSplit[i], points,
              spaceSplit[i -1]));
          lastMode = 'L';
          break;
        default:
          points.push(this.createPoint(spaceSplit[i], points,
              lastMode));
          break;
      }
    }
    this.applyMatrix(points, matrix);
    for (let i = 0; i < points.length; i++) {
      points[i].x += this.svgTranformxOffset;
      points[i].y += this.svgTranformyOffset;
    }
    return points;
  }

  /**
   * @private This is an internal function.
   * @description Creates a Point for a substring of an svg path string.
   * @param {string} dataString - Substring ofs the path.
   * @param {Array} points - Points that have already been generated.
   * @param {string} mode - Specific mode how to interprete the string data.
   * @return {Array} Array containing the vectors.
   */
  createPoint(dataString, points, mode) {
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
        const relativePoint = this.stringToVec(dataString);
        return new Vector(relativePoint.x + points[points.length - 1].x,
            points[points.length - 1].y + relativePoint.y, NaN);
        break;
      case 'L':
        const lPoint = this.stringToVec(dataString);
        return new Vector(lPoint.x,
            lPoint.y, lPoint.r);
        break;
    }
  }
}

module.exports = MeshCreator;
