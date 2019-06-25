const EventEmitter = require('events').EventEmitter;
const Device = require('./device');
const Vector = require('./vector');

/**
 * @description Class for listening for reaching a position.
 * @extends EventEmitter
 */
class PositionListener extends EventEmitter {
  /**
   * @description Creates a new position listener.
   * @param {Device} device - The device that has to be listened for.
   * @param {number} index - The index of the handle to be listened for.
   * @param {Vector} target - The position to be checked for.
   * @param {boolean} [active=true] - If the Listener is active or not.
   * @param {number} [radius=2] - The radius that is considered as reached.
   */
  constructor(device, index, target, active = true, radius = 2) {
    super();
    this.device = device;
    this.index = index;
    this.target = target;
    this.callback;
    this.startListening();
    this.active = active;
    this.radius = radius;
  }
  /**
   * @description Starts the listen process.
   */
  startListening() {
    if (this.index == 0) {
      this.callback = this.listenForMe.bind(this);
      this.device.addListener('handleMoved', this.callback);
    } else if (this.index == 1) {
      this.callback = this.listenForIt.bind(this);
      this.device.addListener('handleMoved', this.callback);
    }
  }

  /**
   * @description Starts the listen process for the me handle.
   * @param {number} index - The index of the handle for the provided position.
   * @param {Vector} position - The provided position of a handle.
   */
  listenForMe(index, position) {
    if (this.active && this.index == 0 &&
      position.difference(this.target).length() <= this.radius) {
      this.device.removeListener('handleMoved', this.callback);
      this.emit('positionReached');
    }
  }

  /**
   * @description Starts the listen process for the it handle.
   * @param {number} index - The index of the handle for the provided position.
   * @param {Vector} position - The provided position of a handle.
   */
  listenForIt(index, position) {
    if (this.active && this.index == 1 &&
      position.difference(this.target).length() <= this.radius) {
      this.device.removeListener('handleMoved', this.callback);
      this.emit('positionReached');
    }
  }
}

module.exports = PositionListener;
