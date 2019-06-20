'use strict';

const Forcefield = require('./forcefield');
const Mesh = require('./mesh');
const HandleMovement = require('../handleMovement');
const Vector = require('../vector');

/**
 * @description Forcefield based on an custom mesh.
 * @extends Forcefield
 */
class MeshForcefield extends Forcefield {
  /**
   * @description Creates a new MeshColldier with the given mesh and callback.
   * @param {Mesh} mesh - The mesh which the collider should be
   * based on.
   * @param {HandleMovement} callback - The function calculating the force
   * applied inside the forcefield. Parameters are the current and previous
   * god object positions.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Forcefield).
   */
  constructor(mesh, callback, handles) {
    super(callback, handles);
    this.mesh = mesh;
  }

  /**
   * @private This is an internal function.
   * @description Checks if the given point is inside the mesh.
   * @param {Vector} position - Point to check.
   * @return {boolean} True if the point is inside, false otherwise.
   */
  contains(position) {
    return this.mesh.contains(
        position.difference(this.hapticObject.position));
  }
}

module.exports = MeshForcefield;
