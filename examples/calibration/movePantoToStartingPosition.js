'use strict';

const {Broker} = require('../../lib/dualpantoframework');

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      Broker.runScript([
        () => device.sendStartingPositionRequest(),
        () => Broker.waitMS(3000)
      ]);
    }
  }
});
