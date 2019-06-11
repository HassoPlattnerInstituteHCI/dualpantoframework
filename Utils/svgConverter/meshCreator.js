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
   * @description Parses an path string to multiple vectors.
   * @param {string} svgString - String that contains the path.
   * @return {Array} Array containing the vectors.
   */
  parseSvgPath(svgString) {
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
          points.push(new Vector(mPoint.x + this.svgTranformxOffset, mPoint.y +
            this.svgTranformyOffset, mPoint.r));
          break;
        case 'M':
          lastMode = 'L';
          i++;
          const MPoint = this.stringToVec(spaceSplit[i]);
          points.push(new Vector(MPoint.x + this.svgTranformxOffset, MPoint.y +
            this.svgTranformyOffset, MPoint.r));
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
        return new Vector(parseFloat(dataString) + this.svgTranformxOffset,
            points[points.length - 1].y, NaN);
        break;
      case 'v':
        return new Vector(points[points.length - 1].x,
            parseFloat(dataString) + points[points.length - 1].y, NaN);
        break;
      case 'V':
        return new Vector(points[points.length - 1].x,
            parseFloat(dataString) + this.svgTranformyOffset, NaN);
        break;
      case 'l':
        const relativePoint = this.stringToVec(dataString);
        return new Vector(relativePoint.x + points[points.length - 1].x,
            points[points.length - 1].y + relativePoint.y, NaN);
        break;
      case 'L':
        const lPoint = this.stringToVec(dataString);
        return new Vector(lPoint.x + this.svgTranformxOffset,
            lPoint.y + this.svgTranformyOffset, lPoint.r);
        break;
    }
  }
}

module.exports = MeshCreator;
