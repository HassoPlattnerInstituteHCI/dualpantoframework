'use strict';

// entry file, exported as 'the framework'

const SerialPort = require('serialport');
const usb = !process.env.CI?require('usb'):null;
const Device = require('./device');
const {broker} = require('./broker');
const Vector = require('./vector');
const Components = require('./components');
const HapticObject = require('./hapticObject');
const open = require('open');
const PositionListener = require('./positionListener');
module.exports = {
  Broker: broker,
  Vector,
  Components,
  HapticObject,
  open,
  PositionListener
};

// require async to dirty fix cyclic dependency
process.nextTick(() => {
  require('../utils/viDeb/index');
});

// @TODO: move the following stuff into the correct files

/**
 * @private This is an internal function.
 * @description Permanently monitor connected devices and emit updates.
 */
function serialRecv() {
  setImmediate(serialRecv);
  for (const device of broker.devices.values()) {
    device.poll();
  }
  const currentDevices = broker.getDevices();
  const attached = new Set();
  const detached = new Set();
  for (const device of currentDevices) {
    if (!broker.prevDevices.has(device)) {
      attached.add(device);
    }
  }
  for (const device of broker.prevDevices) {
    if (!currentDevices.has(device)) {
      detached.add(device);
    }
  }
  broker.prevDevices = currentDevices;
  if (attached.size > 0 || detached.size > 0) {
    broker.emit('devicesChanged', currentDevices, attached, detached);
  }
}
serialRecv();

/**
 * @private This is an internal function.
 * @description Check connected devices.
 */
function autoDetectDevices() {
  SerialPort.list().then((ports) => {
    // if (err) {
    //   console.error(err);
    //   return;
    // }
    let foundAny = false;
    for (const port of ports) {
      if (port.vendorId && port.vendorId == '2341'
          || port.manufacturer && [
            'Arduino LLC',
            'Atmel Corp. at91sam SAMBA bootloader',
            'FTDI',
            'CP210x',
            'Silicon Labs'].some((m) => port.manufacturer.includes(m))) {
        new Device(port.comName);
        foundAny = true;
      }
    }
    if (!foundAny) {
      console.log('No supported devices found. Currently connected:');
      for (const port of ports) {
        console.log(`[${port.vendorId}] ${port.manufacturer}`);
      }
    }
  });
}
autoDetectDevices();
if (!process.env.CI) {
  usb.on('attach', autoDetectDevices);
  usb.on('detach', autoDetectDevices);
}
