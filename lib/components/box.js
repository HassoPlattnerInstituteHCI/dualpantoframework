'use strict';

const TraceableObject = require('./traceableObject');
const Vector = require('../vector');
const {broker} = require('../broker.js');

/**
 * @description Simple 2D box class for use with box-based components.
 * @extends TraceableObject
 */
class Box extends TraceableObject {
  /**
   * @description Creates a new box.
   * @param {Vector} size - The size of the Box defined as vector.
   * @param {number|number[]} [handles=[]] - The handle or handles which this
   * component should apply to. Defaults to neither (default defined
   * in Component). It is recommended to leave this value set to neither,
   * as the box itself doesn't have any behaviour anyway.
   */
  constructor(size, handles) {
    super(handles);
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
   * @private This is an internal function.
   * @description Prints out the vertices for debugging purposes.
   */
  print() {
    const offset = this.hapticObject.position;
    const pointA = new Vector(-this.halfSize.x, this.halfSize.y).sum(offset);
    const pointB = new Vector(-this.halfSize.x, -this.halfSize.y).sum(offset);
    const pointC = new Vector(this.halfSize.x, -this.halfSize.y).sum(offset);
    const pointD = new Vector(this.halfSize.x, this.halfSize.y).sum(offset);
    console.log('Box: [');
    console.log('   ', pointA);
    console.log('   ', pointB);
    console.log('   ', pointC);
    console.log('   ', pointD);
    console.log(']');
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
          pointA, 50).then(() => resolve(resolve)));
      broker.runScript(traceScript);
    });
  }
}

module.exports = Box;
