const EventEmitter = require('events').EventEmitter;
let device;
let index;
let target;
let listener;
const Device = require('./device');
const Vector = require('./vector');

/**
 * @description Class for listening for reaching a position.
 * @extends EventEmitter
 */
class PositionListener extends EventEmitter {
  /**
   * @description Creates a new position listener.
   * @param {Device} _device - The device that has to be listened for.
   * @param {number} _index - The index of the handle to be listened for.
   * @param {Vector} _target - The position to be checked for.
   */
  constructor(_device, _index, _target) {
    super();
    device = _device;
    index = _index;
    target = _target;
    listener = this;
    startListening();
  }
}

/**
 * @description Starts the listen process.
 */
const startListening = () => {
  if (index == 0) {
    device.on('handleMoved', listenForMe);
  } else if (index == 1) {
    device.on('handleMoved', listenForIt);
  }
};

/**
 * @description Starts the listen process for the me handle.
 * @param {number} index - The index of the handle for the provided position.
 * @param {Vector} position - The provided position of a handle.
 */
const listenForMe = (index, position) => {
  if (index == 0 && position.difference(target).length() <= 2) {
    device.removeListener('handleMoved', listenForMe);
    listener.emit('positionReached');
  }
};

/**
 * @description Starts the listen process for the it handle.
 * @param {number} index - The index of the handle for the provided position.
 * @param {Vector} position - The provided position of a handle.
 */
const listenForIt = (index, position) => {
  console.log('what is happening');
  if (index == 1 && position.difference(target).length() <= 2) {
    console.log('emit');
    device.removeListener('handleMoved', listenForIt);
    listener.emit('positionReached');
  }
};

module.exports = PositionListener;
