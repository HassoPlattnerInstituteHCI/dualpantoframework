'use strict';

const Forcefield = require('./forcefield');
const Mesh = require('./mesh');
const HandleMovement = require('../handleMovement');

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
    this.traceableObject = mesh;
  }
}

module.exports = MeshForcefield;
