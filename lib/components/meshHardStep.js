'use strict';

const HardStep = require('./hardStep');
const MeshCollider = require('./meshCollider');

/**
 * @description Step shape with hard edge,  based on an custom mesh.
 * @extends HardStep
 */
class MeshHardStep extends HardStep {
  /**
   * @description Creates a new MeshHardStep with the given mesh and strengths.
   * @param {import('./mesh')} mesh - The mesh which the HardStep should be
   * based on.
   * @param {number} enterStrength - The strength needed to get into the box.
   * Useful values are from 0 to 5.
   * @param {number} leaveStrength - The strength needed to get into the box.
   * Useful values are from 0 to 5.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in HardStep).
   */
  constructor(mesh, enterStrength, leaveStrength, handles) {
    super(enterStrength, leaveStrength, handles);
    this.mesh = mesh;
  }

  /**
   * @private This is an internal function.
   * @description Initializes the component. Don't call this method -
   * this will automatically happen when adding the component to a HapticObject.
   */
  init() {
    MeshCollider.prototype.init.call(this);
    HardStep.prototype.init.call(this);
  }
}

module.exports = MeshHardStep;
