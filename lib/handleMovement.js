'use strict';

/**
 * @private This is an internal class.
 * @description Data structure for passing movements for updating HapticObject
 * components.
 */
class HandleMovement {
  /**
   * @private This is an internal function.
   * @description Creates a HandleMovement object.
   * @param {number} index - Index of the moved handle.
   * @param {import('./vector')} oldPosition - The last physical position.
   * @param {import('./vector')} newPosition - The new physical position.
   * @param {import('./vector')} oldGodObjectPosition - The last god object
   * position.
   * @param {import('./vector')} newGodObjectPosition - The new god object
   * position.
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
