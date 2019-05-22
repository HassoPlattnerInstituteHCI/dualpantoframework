/* eslint-disable require-jsdoc */
const Collider = require('./collider');

class MeshCollider extends Collider {
  constructor(mesh, handles) {
    super(handles);
    this.mesh = mesh;
    // TODO create obstacle
  }
}

module.exports = MeshCollider;
