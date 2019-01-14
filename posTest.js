'use strict';

const Framework = require('.'),
      {Vector} = Framework;

Framework.on('devicesChanged', function(devices, attached, detached) {
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for(const device of devices) {
      if(device){
        device.createObstacle([new Vector(-20, -10, 0), new Vector(20, -10, 0), new Vector(20, -20, 0), new Vector(-20, -20, 0)]);
        device.on('handleMoved', function(index, position){
          console.log('index: ', index, ' position: ', position);
        });
      }
  }
});