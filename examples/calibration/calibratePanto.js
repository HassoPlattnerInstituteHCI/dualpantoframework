'use strict';

const {Broker} = require('../../lib/dualpantoframework');

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      device.sendCalibrationRequest();
    }
  }
});
