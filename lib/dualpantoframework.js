'use strict';

// entry file, exported as 'the framwork'

const SerialPort = require('serialport'),
      usb = !process.env.CI?require('usb'):null;

const Device = require('./device');
const {broker} = require('./shared');
broker.Vector = require('./vector');
module.exports = broker;

// require async to dirty fix cyclic dependency
process.nextTick(() => {
	const ViDeb = require('../Utils/ViDeb/index');
});

// @TODO: move the following stuff into the correct files

function serialRecv() {
    setImmediate(serialRecv);
    for(const device of broker.devices.values()){
        device.poll();
        device.step();
    }
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
        let foundAny = false;
        for(const port of ports)
            if(port.vendorId && port.vendorId == '2341'
            || port.manufacturer && ['Arduino LLC', 'Atmel Corp. at91sam SAMBA bootloader', 'Silicon Labs'].some(m => port.manufacturer.includes(m)))
            {
                new Device(port.comName);
                foundAny = true;
            }

        if(!foundAny)
        {
            console.log("No supported devices found. Currently connected:");
            for(const port of ports)
            {
                console.log(`[${port.vendorId}] ${port.manufacturer}`)
            }
        }
    });
}
autoDetectDevices();
if(!process.env.CI) {
    usb.on('attach', autoDetectDevices);
    usb.on('detach', autoDetectDevices);
}
