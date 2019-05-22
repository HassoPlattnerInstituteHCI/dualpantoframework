/* eslint-disable require-jsdoc */
const Trigger = require('./trigger');

class BoxTrigger extends Trigger {
  constructor(size, handles) {
    super(handles);
    this.halfSize = size.scaled(0.5);
  }

  contains(position) {
    const offset = this.hapticObject.position;
    return position.x > offset.x - this.halfSize.x &&
      position.y > offset.y - this.halfSize.y &&
      position.x < offset.x + this.halfSize.x &&
      position.y < offset.y + this.halfSize.y;
  }
}

module.exports = BoxTrigger;
