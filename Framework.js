'use strict';

const serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./Vector.js'),
      SerialPort = require('serialport');

const devices = new Map();
module.exports.getDevices = function() {
    return devices.values();
};

class Device {
    constructor(port) {
        if(process.platform == 'darwin') // macOS
            port = port.replace('/tty.', '/cu.');
        else if(process.platform == 'win32') // windows
            port = '//.//'+port;
        if(devices.has(port))
            return devices.get(port);
        devices.set(port, this);
        this.port = port;
        this.serial = serial.open(port);
        this.lastKnownPositions = [];
        this.lastTargetPositions = [];
    }

    disconnect() {
        if(this.onDisconnect)
            this.onDisconnect();
        serial.close(this.serial);
    }

    poll() {
        const packets = serial.poll(this.serial);
        if(packets.length == 0)
            return;
        const packet = packets[packets.length-1];
        if(packet.length == 16)
            this.hardwareConfigHash = packet;
        else if(packet.length == 4*6) {
            const values = [];
            for(let i = 0; i < 6; ++i)
                values[i] = packet.readFloatLE(i*4);
            this.lastKnownPositions[0] = new Vector(values[0], values[1], values[2]);
            this.lastKnownPositions[1] = new Vector(values[3], values[4], values[5]);
            if(this.onHandleMoved) {
                this.onHandleMoved(0, this.lastKnownPositions[0]);
                this.onHandleMoved(1, this.lastKnownPositions[1]);
            }
        }
    }

    send(packet) {
        serial.send(this.serial, packet);
    }

    moveHandleTo(index, target) {
        this.lastTargetPositions[index] = target;
        const values = (target) ? [target.x, target.y, target.r] : [NaN, NaN, NaN],
              packet = new Buffer(1+3*4);
        packet[0] = index;
        packet.writeFloatLE(values[0], 1);
        packet.writeFloatLE(values[1], 5);
        packet.writeFloatLE(values[2], 9);
        this.send(packet);
    }
}

function serialRecv() {
    setImmediate(serialRecv);
    for(const device of devices.values())
        device.poll();
}
serialRecv();

function autoDetectDevices() {
    SerialPort.list(function(err, ports) {
        if(err)
            console.error(err);
        else
            for(const port of ports)
                if(port.manufacturer && port.manufacturer.includes('Arduino LLC'))
                    new Device(port.comName);
        if(module.exports.onDevicesChanged)
            module.exports.onDevicesChanged(devices.values());
    });
}
autoDetectDevices();
