'use strict';

const {Broker} = require('../..');

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      Broker.runScript([
        () => device.sendCalibrationRequest(),
        () => Broker.waitMS(3000)
      ]);
    }
  }
});
