'use strict';

const {Broker} = require('../..');

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      const count = [0, 0];
      device.on('handleMoved', function(index, position) {
        count[index]++;
      });
      setInterval(() => {
        console.log('me:', count[0], 'it:', count[1]);
        count[0] = 0;
        count[1] = 0;
      }, 1000);
    }
  }
});
