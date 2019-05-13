'use strict';

const Framework = require('.');
const {Vector} = Framework;

Framework.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      device.on('handleMoved', function(index, position) {
        if (index == 0) {
          // console.log(
          //     'index:', index,
          //     'x:', position.x,
          //     'y:', position.y,
          //     'r:', position.z);
        }
      });
      // setTimeout(() => {
      //   device.createObstacle([
      //     new Vector(50, -200, 0),
      //     new Vector(-50, -200, 0),
      //     new Vector(-50, -80, 0),
      //     new Vector(50, -80, 0)]);
      // }, 6000);
      setTimeout(() => {
        device.movePantoTo(0, new Vector(-100, -100));
      }, 3000);
      setTimeout(() => {
        device.unblockHandle(0);
      }, 4000);
    }
  }
});
