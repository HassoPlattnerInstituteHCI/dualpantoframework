'use strict';

const Framework = require('.');
const {Vector} = Framework;

Framework.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for(const device of devices) {
      if(device){
        device.on('handleMoved', function(index, position){
          console.log('index: ', index, ' position: ', position);
        });
        setTimeout(() => {
          const id = device.createObstacle([
            new Vector(50, -200, 0),
            new Vector(-50, -200, 0),
            new Vector(-50, -80, 0),
            new Vector(50, -80, 0)]);
        }, 3000);
      }
  }
});
