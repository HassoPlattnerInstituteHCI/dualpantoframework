'use strict';

const Collider = require('./collider');

/**
 * @description Collider based on an custom mesh.
 * @extends Collider
 */
class MeshCollider extends Collider {
  /**
   * @description Creates a new MeshColldier with the given mesh.
   * @param {import('./mesh')} mesh - The mesh which the collider should be
   * based on.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Collider).
   */
  constructor(mesh, handles) {
    super(handles);
    this.mesh = mesh;
  }

  /**
   * @private This is an internal function.
   * @description Initializes the component. Don't call this method -
   * this will automatically happen when adding the component to a HapticObject.
   */
  init() {
    if (this.handles.length == 0) {
      console.log(
          'Skipping obstacle creation for collider affecting zero handles');
      return;
    }

    this.create();
  }
}

module.exports = MeshCollider;
