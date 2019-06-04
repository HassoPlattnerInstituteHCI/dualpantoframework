'use strict';

const Forcefield = require('./forcefield');

/**
 * @description Rectangular forcefield, centered at the HapticObject's position.
 * @extends Forcefield
 */
class BoxForcefield extends Forcefield {
  /**
   * @description Creates a new BoxForcefield with the given size.
   * @param {import('../vector')} size - The size of the created box.
   * @param {(position: import('../vector'), lastPosition: import('../vector'))
   * => import('../vector')} callback - The function calculating the force
   * applied inside the forcefield. Parameters are the current and previous
   * god object positions.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Forcefield).
   */
  constructor(size, callback, handles) {
    super(callback, handles);
    this.halfSize = size.scaled(0.5);
  }

  /**
   * @private This is an internal function.
   * @description Checks if the given point is inside the box.
   * @param {import('../vector')} position - Point to check.
   * @return {boolean} True if the point is inside, false otherwise.
   */
  contains(position) {
    const offset = this.hapticObject.position;
    return position.x > offset.x - this.halfSize.x &&
      position.y > offset.y - this.halfSize.y &&
      position.x < offset.x + this.halfSize.x &&
      position.y < offset.y + this.halfSize.y;
  }
}

module.exports = BoxForcefield;
