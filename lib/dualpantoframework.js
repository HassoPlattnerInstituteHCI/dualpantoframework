'use strict';

// entry file, exported as 'the framwork'

const SerialPort = require('serialport'),
      usb = !process.env.CI?require('usb'):null;

const Device = require('./device');

const {broker} = require('./shared');

module.exports = broker;

// require async to dirty fix cyclic dependency
process.nextTick(() => {
	const ViDeb = require('../Utils/ViDeb/index');
});

// @TODO: move the following stuff into the correct files

function serialRecv() {
    setImmediate(serialRecv);
    for(const device of broker.devices.values())
        device.poll();
    const currentDevices = broker.getDevices(),
          attached = new Set(),
          detached = new Set();
    for(const device of currentDevices)
        if(!broker.prevDevices.has(device))
            attached.add(device);
    for(const device of broker.prevDevices)
        if(!currentDevices.has(device))
            detached.add(device);
    broker.prevDevices = currentDevices;
    if(attached.size > 0 || detached.size > 0)
        broker.emit('devicesChanged', currentDevices, attached, detached);
}
serialRecv();

function autoDetectDevices() {
    SerialPort.list(function(err, ports) {
        if(err) {
            console.error(err);
            return;
        }
        for(const port of ports)
            if(port.vendorId && port.vendorId == '2341'
            || port.manufacturer && (port.manufacturer.includes('Arduino LLC') || port.manufacturer.includes('Atmel Corp. at91sam SAMBA bootloader')))
                new Device(port.comName);
    });
}
autoDetectDevices();
if(!process.env.CI) {
    usb.on('attach', autoDetectDevices);
    usb.on('detach', autoDetectDevices);
}
