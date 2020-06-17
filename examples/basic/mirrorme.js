'use strict';

const {Broker, Vector} = require('../..');

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      device.on('handleMoved', function(index, pos) {
        if (index==0) {
          device.moveHandleTo(1, new Vector(pos.x, pos.y, pos.r));
        }
      });
    }
  }
});
