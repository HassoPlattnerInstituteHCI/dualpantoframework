'use strict';

const Forcefield = require('./forcefield');
const Vector = require('../vector');
const ForcefieldCallback = require('./forcefieldCallback');
const {broker} = require('../broker.js');

/**
 * @description Rectangular forcefield, centered at the HapticObject's position.
 * @extends Forcefield
 */
class BoxForcefield extends Forcefield {
  /**
   * @description Creates a new BoxForcefield with the given size.
   * @param {Vector} size - The size of the created box.
   * @param {ForcefieldCallback} callback - The function calculating the force
   * applied inside the forcefield. Parameters are the current and previous
   * god object positions.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Forcefield).
   */
  constructor(size, callback, handles) {
    super(callback, handles);
    this.halfSize = size.scaled(0.5);
  }

  /**
   * @private This is an internal function.
   * @description Checks if the given point is inside the box.
   * @param {Vector} position - Point to check.
   * @return {boolean} True if the point is inside, false otherwise.
   */
  contains(position) {
    const offset = this.hapticObject.position;
    return position.x > offset.x - this.halfSize.x &&
      position.y > offset.y - this.halfSize.y &&
      position.x < offset.x + this.halfSize.x &&
      position.y < offset.y + this.halfSize.y;
  }

  /**
   * @description Traces the shape of the box forcefield.
   * @param {number} index - Index of the handle to trace the shape.
   * @return {Promise} The promise that runs the trace script.
   */
  trace(index = 1) {
    return new Promise((resolve) => {
      const offset = this.hapticObject.position;
      const pointA = new Vector(-this.halfSize.x, this.halfSize.y).sum(offset);
      const pointB = new Vector(-this.halfSize.x, -this.halfSize.y).sum(offset);
      const pointC = new Vector(this.halfSize.x, -this.halfSize.y).sum(offset);
      const pointD = new Vector(this.halfSize.x, this.halfSize.y).sum(offset);
      const traceScript = [];
      traceScript.push(() => this.hapticObject.device.movePantoTo(index,
          pointA));
      traceScript.push(() => this.hapticObject.device.movePantoTo(index,
          pointB, 50));
      traceScript.push(() => this.hapticObject.device.movePantoTo(index,
          pointC, 50));
      traceScript.push(() => this.hapticObject.device.movePantoTo(index,
          pointD, 50));
      traceScript.push(() => this.hapticObject.device.movePantoTo(index,
          pointA, 50).then(resolve(resolve)));
      broker.runScript(traceScript);
    });
  }
}

module.exports = BoxForcefield;
