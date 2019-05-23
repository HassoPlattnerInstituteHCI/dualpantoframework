/* eslint-disable require-jsdoc */
const Collider = require('./collider');

class MeshCollider extends Collider {
  constructor(mesh, handles) {
    super(handles);
    this.mesh = mesh;
  }
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
