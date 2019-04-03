'use strict';

const Framework = require('./../../');
const {Vector} = Framework;

Framework.on('devicesChanged', function(devices, attached, detached) {
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      device.on('handleMoved', function(index, position) {
        console.log('index: ', index, ' position: ', position);
      });
      setTimeout(() => {
        device.createObstacle([
          new Vector(-80, -117, 0),
          new Vector(80, -120, 0)]);
        device.createObstacle([
          new Vector(-80, -123, 0),
          new Vector(80, -120.1, 0)]);
      }, 3000);
    }
  }
});
