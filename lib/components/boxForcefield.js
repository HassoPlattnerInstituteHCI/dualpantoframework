/* eslint-disable require-jsdoc */
const Forcefield = require('./forcefield');

class BoxForcefield extends Forcefield {
  constructor(size, callback, handles) {
    super(callback, handles);
    this.halfSize = size.scaled(0.5);
  }

  inside(handleMovement) {
    const position = handleMovement.newGodObjectPosition;
    const offset = this.hapticObject.position;
    return position.x > offset.x - this.halfSize.x &&
      position.y > offset.y - this.halfSize.y &&
      position.x < offset.x + this.halfSize.x &&
      position.y < offset.y + this.halfSize.y;
  }
}

module.exports = BoxForcefield;
