/* eslint-disable require-jsdoc */
const Component = require('./component');

nextObstacleId = 0;
usedObstacleIds = new Set();

class Trigger extends Component {
  constructor(handles) {
    super(handles || 0);
    this.positionInside = false;
    this.godObjectInside = false;
  }
  updatePosition(handleMovement) {
    const positionInside = this.contains(handleMovement.newPosition);
    const godObjectInside = this.contains(handleMovement.newGodObjectPosition);

    const enter = !this.godObjectInside && godObjectInside;
    const inside = godObjectInside;
    const leave = this.godObjectInside && !godObjectInside;

    const touch = positionInside != godObjectInside;
    const lastTouch = this.positionInside != this.godObjectInside;
    const startTouch = !lastTouch && touch;
    const endTouch = lastTouch && !touch;

    if (enter) this.emit('enter');
    if (inside) this.emit('inside');
    if (leave) this.emit('leave');
    if (startTouch) this.emit('startTouch', inside);
    if (touch) this.emit('touch', inside);
    if (endTouch) this.emit('endTouch', inside);

    this.positionInside = positionInside;
    this.godObjectInside = godObjectInside;
  }
}

module.exports = Trigger;
