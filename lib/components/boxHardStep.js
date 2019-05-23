/* eslint-disable require-jsdoc */
const MeshHardStep = require('./meshHardStep');
const Mesh = require('./mesh');
const Vector = require('../vector');

class BoxHardStep extends MeshHardStep {
  constructor(size, enterStrenght, leaveStrength, handles) {
    super(undefined, enterStrenght, leaveStrength, handles);
    this.halfSize = size.scaled(0.5);
  }

  init() {
    this.mesh = new Mesh([
      new Vector(-this.halfSize.x, this.halfSize.y),
      new Vector(-this.halfSize.x, -this.halfSize.y),
      new Vector(this.halfSize.x, -this.halfSize.y),
      new Vector(this.halfSize.x, this.halfSize.y)
    ]);
    MeshHardStep.prototype.init.call(this);
  }
}

module.exports = BoxHardStep;
