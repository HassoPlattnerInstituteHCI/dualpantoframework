/* eslint-disable require-jsdoc */
const Forcefield = require('./forceField');

class MeshForcefield extends Forcefield {
  constructor(mesh, callback, handles) {
    super(callback, handles);
    this.mesh = mesh;
  }

  inside(handleMovement) {
    return false;
  }
}

module.exports = MeshForcefield;
