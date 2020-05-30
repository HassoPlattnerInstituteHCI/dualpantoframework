'use strict';

const {Broker, Vector} = require('../..');

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      Broker.runScript([
        () => device.movePantoTo(0, new Vector(-20, -50), 50),
        () => Broker.waitMS(2000),
        () => device.movePantoTo(0, new Vector(20, -50), 50),
        () => Broker.waitMS(2000),
        () => device.movePantoTo(1, new Vector(-20, -50), 50),
        () => Broker.waitMS(2000),
        () => device.movePantoTo(1, new Vector(20, -50), 50),
        () => Broker.waitMS(2000),
        () => device.movePantoTo(0, new Vector(NaN, NaN), 50),
        () => Broker.waitMS(2000),
        () => device.movePantoTo(1, new Vector(NaN, NaN), 50)
      ]);
    }
  }
});
