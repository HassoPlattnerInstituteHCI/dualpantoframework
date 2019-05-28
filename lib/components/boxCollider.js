'use strict';

const MeshCollider = require('./meshCollider');
const Mesh = require('./mesh');
const Vector = require('../vector');

/**
 * @description Rectangular collider, centered at the HapticObject's position.
 * @extends MeshCollider - Re-uses the MeshCollider implementation by creating
 * a rectangle mesh.
 */
class BoxCollider extends MeshCollider {
  /**
   * @description Creates a new BoxCollider with the given size.
   * @param {Vector} size - The size of the created box.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Collider).
   */
  constructor(size, handles) {
    super(undefined, handles);
    this.halfSize = size.scaled(0.5);
  }

  /**
   * @private This is an internal function.
   * @description Initializes the component. Don't call this method -
   * this will automatically happen when adding the component to a HapticObject.
   */
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
