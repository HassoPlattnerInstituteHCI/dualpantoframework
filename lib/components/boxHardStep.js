'use strict';

const MeshHardStep = require('./meshHardStep');
const Mesh = require('./mesh');
const Vector = require('../vector');

/**
 * @description Rectangular step shape with hard edge, centered at the
 * HapticObject's position.
 * @extends MeshHardStep - Re-uses the MeshHardStep implementation by creating
 * a rectangle mesh.
 */
class BoxHardStep extends MeshHardStep {
  /**
   * @description Creates a new BoxHardStep with the given size and strengths.
   * @param {Vector} size - The size of the created box.
   * @param {number} enterStrength - The strength needed to get into the box.
   * Useful values are from 0 to 5.
   * @param {number} leaveStrength - The strength needed to get into the box.
   * Useful values are from 0 to 5.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in HardStep).
   */
  constructor(size, enterStrength, leaveStrength, handles) {
    super(undefined, enterStrength, leaveStrength, handles);
    this.halfSize = size.scaled(0.5);
  }

  /**
   * @private This is an internal function.
   * @description Initializes the component. Don't call this method -
   * this will automatically happen when adding the component to a HapticObject.
   */
  init() {
    this.mesh = new Mesh([
      new Vector(-this.halfSize.x, this.halfSize.y),
      new Vector(-this.halfSize.x, -this.halfSize.y),
      new Vector(this.halfSize.x, -this.halfSize.y),
      new Vector(this.halfSize.x, this.halfSize.y)
    ]);
    MeshHardStep.prototype.init.call(this);
  }
}

module.exports = BoxHardStep;
