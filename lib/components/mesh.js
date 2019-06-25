'use strict';

const Component = require('./component');
const Vector = require('../vector');
const {broker} = require('../broker.js');

/**
 * @description Simple 2D mesh class for use with mesh-based components.
 * @extends Component
 */
class Mesh extends Component {
  /**
   * @description Creates a new mesh.
   * @param {Vector[]} path - The vertices from which the mesh is
   * created. The first point should not be repeated at the end.
   * @param {number|number[]} [handles=[]] - The handle or handles which this
   * component should apply to. Defaults to neither (default defined
   * in Component). It is recommended to leave this value set to neither,
   * as the mesh itself doesn't have any behaviour anyway.
   */
  constructor(path, handles) {
    super(handles);
    this.path = path;
  }

  /**
   * @private This is an internal function.
   * @description Checks if the given point is inside the mesh.
   * @param {Vector} point - Point to check.
   * @return {boolean} True if the point is inside, false otherwise.
   */
  contains(point) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    const x = point.x; const y = point.y;
    let inside = false;
    for (let i = 0, j = this.path.length - 1;
      i < this.path.length; j = i++) {
      const xi = this.path[i].x; const yi = this.path[i].y;
      const xj = this.path[j].x; const yj = this.path[j].y;
      const intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }

  /**
   * @private This is an internal function.
   * @description Prints out the vertices for debugging purposes.
   */
  print() {
    console.log('Mesh: [');
    for (const point of this.path) {
      console.log('   ', point);
    }
    console.log(']');
  }

  /**
   * @description Traces the shape of the mesh.
   * @param {number} index - Index of the handle to trace the shape.
   * @return {Promise} The promise that runs the trace script.
   */
  trace(index = 1) {
    return new Promise((resolve) => {
      const traceScript = [];
      for (let i = 0; i < this.path.length; i++) {
        traceScript.push(() => this.hapticObject.device.movePantoTo(index,
            this.path[i].sum(this.hapticObject.position)));
      }
      traceScript.push(() => this.hapticObject.device.movePantoTo(index,
          this.path[0].sum(this.hapticObject.position)).then(resolve(resolve)));
      broker.runScript(traceScript);
    });
  }
}

module.exports = Mesh;
