'use strict';

const Framework = require('.'),
      {Vector} = Framework;

Framework.on('devicesChanged', function(devices, attached, detached) {
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for(const device of devices) {
      if(device){
        device.on('handleMoved', function(index, position){
          console.log('index: ', index, ' position: ', position);
        });
        setTimeout(() => {
          console.log("createObstacle");
          const id = device.createObstacle([
            new Vector(50, -200, 0),
            new Vector(-50, -200, 0),
            new Vector(-50, -80, 0),
            new Vector(50, -80, 0)]);
          setTimeout(() => {
            console.log("disableObstacle");
            device.disableObstacle(id);
          }, 5000);
          setTimeout(() => {
            console.log("enableObstacle");
            device.enableObstacle(id);
          }, 10000);
          setTimeout(() => {
            console.log("deleteObstacle");
            device.deleteObstacle(id);
          }, 15000);
        }, 3000);
      }
  }
});
