/* eslint-disable require-jsdoc */
const Component = require('./component');

nextObstacleId = 0;
usedObstacleIds = new Set();

class Trigger extends Component {
  constructor(handles) {
    super(handles || 0);
    this.inside = false;
    this.touching = false;
  }
  updatePosition(handleMovement) {
    let inside = false;
    let touching = false;

    if (this.contains(handleMovement.newGodObjectPosition)) {
      inside = true;
    } else if (this.contains(handleMovement.newPosition)) {
      touching = true;
    }

    if (inside) {
      if (this.inside) {
        this.emit('inside');
      } else {
        this.emit('enter');
      }
    } else if (this.inside) {
      this.emit('leave');
    }
    this.inside = inside;

    if (touching) {
      if (this.touching) {
        this.emit('touch');
      } else {
        this.emit('startTouch');
      }
    } else if (this.touching) {
      this.emit('endTouch');
    }
    this.touching = touching;
  }
}

module.exports = Trigger;
