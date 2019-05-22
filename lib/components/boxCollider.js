/* eslint-disable require-jsdoc */
const MeshCollider = require('./meshCollider');
const Mesh = require('./mesh');
const Vector = require('../vector');

class BoxCollider extends MeshCollider {
  constructor(size, handles) {
    super(undefined, handles);
    this.halfSize = size.scaled(0.5);
  }
  init() {
    this.mesh = new Mesh([
      new Vector(-this.halfSize.x, this.halfSize.y),
      new Vector(-this.halfSize.x, -this.halfSize.y),
      new Vector(this.halfSize.x, -this.halfSize.y),
      new Vector(this.halfSize.x, this.halfSize.y)
    ]);
    MeshCollider.prototype.init.call(this);
  }
}

module.exports = BoxCollider;
