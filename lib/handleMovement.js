'use strict';

/**
 * @typedef {import('./vector')} Vector
 */

/**
 * @description Data structure for passing movements for updating HapticObject
 * components.
 * @private
 */
class HandleMovement {
  /**
   * @description Creates a HandleMovement object.
   * @private
   * @param {number} index - Index of the moved handle.
   * @param {Vector} oldPosition - The last physical position.
   * @param {Vector} newPosition - The new physical position.
   * @param {Vector} oldGodObjectPosition - The last god object position.
   * @param {Vector} newGodObjectPosition - The new god object position.
   */
  constructor(
      index,
      oldPosition,
      newPosition,
      oldGodObjectPosition,
      newGodObjectPosition) {
    this.index = index;
    this.oldPosition = oldPosition;
    this.newPosition = newPosition;
    this.oldGodObjectPosition = oldGodObjectPosition;
    this.newGodObjectPosition = newGodObjectPosition;
  }
}

module.exports = HandleMovement;
