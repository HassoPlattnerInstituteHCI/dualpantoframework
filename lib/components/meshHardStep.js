/* eslint-disable require-jsdoc */
const {HardStep, MeshCollider} = require('.');

class MeshHardStep extends HardStep {
  constructor(mesh, handles) {
    super(handles);
    this.mesh = mesh;
  }

  init() {
    MeshCollider.prototype.init.call(this);
    HardStep.prototype.init.call(this);
  }
}

module.exports = MeshHardStep;
