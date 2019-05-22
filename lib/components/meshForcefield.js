/* eslint-disable require-jsdoc */
const Forcefield = require('./forceField');

class MeshForcefield extends Forcefield {
  constructor(mesh, callback, handles) {
    super(callback, handles);
    this.mesh = mesh;
  }

  contains(position) {
    return this.mesh.contains(
        position.difference(this.hapticObject.position));
  }
}

module.exports = MeshForcefield;
