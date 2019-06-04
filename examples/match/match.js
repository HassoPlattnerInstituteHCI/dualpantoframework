'use strict';

const DualPantoFramework = require('../..');
const {Broker} = DualPantoFramework;

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    device.on('handleMoved', (index, pos) => {
      const devices = Array.from(Broker.getDevices());
      if (index != 0 || devices.length != 2) {
        return;
      }
      const otherDevice = (devices[0] === device) ? devices[1] : devices[0];
      otherDevice.moveHandleTo(1, pos);
    });
  }
});
