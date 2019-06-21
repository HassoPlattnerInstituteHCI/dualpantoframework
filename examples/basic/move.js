'use strict';

const {Broker, Vector} = require('../..');

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      Broker.run_script([
        () => device.movePantoTo(0, new Vector(-100, -100), 50),
        () => Broker.waitMS(3000),
        () => device.movePantoTo(0, new Vector(0, -100), 50),
        () => Broker.waitMS(3000),
        () => device.movePantoTo(0, new Vector(100, -100), 50),
        () => Broker.waitMS(3000),
        () => device.unblockHandle(0),
        () => device.movePantoTo(1, new Vector(-100, -100), 50),
        () => Broker.waitMS(3000),
        () => device.movePantoTo(1, new Vector(0, -100), 50),
        () => Broker.waitMS(3000),
        () => device.movePantoTo(1, new Vector(100, -100), 50),
        () => Broker.waitMS(3000),
        () => device.unblockHandle(1)
      ]);
    }
  }
});
