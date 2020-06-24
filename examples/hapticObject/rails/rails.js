/* eslint-disable require-jsdoc */
const DualPantoFramework = require('../../../lib/dualpantoframework');
const {Broker, open} = DualPantoFramework;

const {scene1} = require('./scenes');
/**
 * @type {import('../../../lib/device')}
 */
let device;

Broker.on('devicesChanged', function(devices) {
  for (const newdevice of devices) {
    if (!device) {
      device = newdevice;
      open('http://localhost:8080/map.html');
      setTimeout(start, 1000);
    }
  }
});

function start() {
  // loads a scene with a couple of obstacles and haptic rails
  scene1(device);
}
