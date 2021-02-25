'use strict';

const BoxCollider = require('./boxCollider');
const Vector = require('../vector');

/**
 * @description A rail that guides to an object of interest and
 * can be passed by the user
 * @extends BoxCollider - Re-uses the BoxCollider
 */
class Rail extends BoxCollider {
  /**
   * @description Creates a new Rail at the vector with the specified.
   * @param {Vector} size - The size of the created box.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Collider).
   */
  constructor(size, handles) {
    super(size, handles);
  }

  /**
   * @private This is an internal function.
   * @description Sends a "create passable obstacle" message to the hardware.
   * @param {number[]} posArray - The position data to be transferred.
   * @param {number} index - The index of the handle affected by this message,
   * with -1 meaning both handles. Defaults to the handle(s) specified during
   * component creation.
   */
  sendCreate(posArray, index) {
    this.send(0xC1, posArray, index);
  }
}

module.exports = Rail;
