/* eslint-disable require-jsdoc */
const DualPantoFramework = require('../..');
const {Vector, Broker, Components} = DualPantoFramework;
const {BoxForcefield} = Components;

/**
 * @type {import('../../lib/device')}
 */
let device;

Broker.on('devicesChanged', function(devices) {
  for (const newdevice of devices) {
    if (!device) {
      device = newdevice;
      start();
    }
  }
});

const rails = function(position, lastPosition) {
  let force = 0;
  if (position.x < 0) {
    force = (position.x % 20) + 10;
  } else {
    force = (position.x % 20) - 10;
  }
  return new Vector(-force*0.2, 0, NaN);
};

function start() {
  const hapticObject = device.addHapticObject(new Vector(0, -100));
  hapticObject.addComponent(new BoxForcefield(new Vector(400, 200), rails));
}
