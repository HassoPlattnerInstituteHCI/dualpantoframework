/* eslint-disable require-jsdoc */

class HandleMovement {
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
