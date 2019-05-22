/* eslint-disable require-jsdoc */
const Component = require('./component');

class Forcefield extends Component {
  constructor(callback, handles) {
    super(handles || 0);
    this.callback = callback;
    this.forced = {};
  }

  updatePosition(handleMovement) {
    const index = handleMovement.index;
    if (this.inside(handleMovement)) {
      const force = this.callback(
          handleMovement.newGodObjectPosition,
          handleMovement.oldGodObjectPosition);
      this.forced[index] = true;
      if (force.length() > 0) {
        this.hapticObject.device.applyForceTo(index, force);
      }
    } else if (this.forced[index]) {
      this.hapticObject.device.unblock(index);
      this.forced[index] = false;
    }
  }
}

module.exports = Forcefield;
