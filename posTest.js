'use strict';

const Framework = require('.');
const {Vector} = Framework;

Framework.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      setTimeout(() => {
        device.movePantoTo(0, new Vector(-100, -100), 100);
      }, 1000);
      setTimeout(() => {
        device.movePantoTo(0, new Vector(0, -100), 100);
      }, 2500);
      setTimeout(() => {
        device.movePantoTo(0, new Vector(100, -100), 100);
      }, 4000);
      setTimeout(() => {
        device.unblockHandle(0);
      }, 5500);
      setTimeout(() => {
        device.createObstacle([
          new Vector(50, -200, 0),
          new Vector(-50, -200, 0),
          new Vector(-50, -110, 0),
          new Vector(50, -110, 0)]);
      }, 6000);
    }
  }
});
