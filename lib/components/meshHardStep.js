/* eslint-disable require-jsdoc */
const HardStep = require('./hardStep');
const MeshCollider = require('./meshCollider');

class MeshHardStep extends HardStep {
  constructor(mesh, enterStrenght, leaveStrength, handles) {
    super(enterStrenght, leaveStrength, handles);
    this.mesh = mesh;
  }

  init() {
    MeshCollider.prototype.init.call(this);
    HardStep.prototype.init.call(this);
  }
}

module.exports = MeshHardStep;
