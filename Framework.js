'use strict';

const serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./Vector.js'),
      SerialPort = require('serialport'),
      usb = !process.env.CI?require('usb'):null,
      EventEmitter = require('events').EventEmitter,
      co = require('co'),
      say = require('say-promise'),
      PlaySound = require('play-sound')(),
      VoiceCommand = require('./voice-command');

class Broker extends EventEmitter {
    constructor() {
        super();
        this.devices = new Map();
        this.prevDevices = new Set();
        this.disconnectTimeout = 5; // Seconds
        this.voiceCommand;
    }

    run_script(promise_list) {
      this._running_script = true;
      var script_generator = conditional_promise_generator(promise_list, () => this._running_script);
      co(script_generator)
      .catch(console.log)
    }

    speakText(txt, language) {
      var speak_voice = "Anna";
      if (language == "EN") {
          speak_voice = "Alex";
      }
      this.emit('saySpeak', txt);
      return say.speak(txt, speak_voice, 1.4, (err) => {
          if(err) {
              console.error(err);
              return;
          }
      });
    }

    sayText(txt) {
      this.run_script([
        () => this.speakText(txt)
      ]);
    }

    playSound(filename) {
      console.log('play sound is not implemented yet');
    }

    setCommands(commands){
      this.voiceCommand = new VoiceCommand(commands);
      this.voiceCommand.on('command', function(command) {
        console.log('Keyword Recognized: ',command);
        this.emit('keywordRecognized', command);
      }.bind(this));
    }

    beginListening(){
      return new Promise (resolve => 
      {
        this.voiceCommand.startListening();
        resolve(resolve);
      });
    }

    haltListening(){
      return new Promise (resolve => 
      {
        this.voiceCommand.stopListening();
        resolve(resolve);
      });
    }

    waitMS(ms) {
        return new Promise(resolve => setTimeout(() => resolve(resolve), ms));
    }

    getDevices() {
        return new Set(this.devices.values());
    }

    getDeviceByPort(port) {
        return this.devices.get(port);
    }

    createVirtualDevice() {
        return new Device('virtual');
    }
}
const broker = new Broker();
module.exports = broker;
const ViDeb = require('./Utils/ViDeb/index');



class Device extends EventEmitter {
    constructor(port) {
        super();
        if(port == 'virtual') {
            let index = 0;
            port = 'virtual0';
            while(broker.devices.has(port))
                port = 'virtual'+(index++);
        } else {
            if(process.platform == 'darwin') // macOS
                port = port.replace('/tty.', '/cu.');
            else if(process.platform == 'win32') // windows
                port = '//.//'+port;
            if(broker.devices.has(port))
                return broker.devices.get(port);
            this.serial = true;
        }
        this.port = port;
        this.lastKnownPositions = [];
        this.lastTargetPositions = [];
        this.lastReceiveTime = process.hrtime();
        broker.devices.set(this.port, this);
        if(this.serial)
            this.serial = serial.open(this.port);
    }

    disconnect() {
        if(this.serial)
            serial.close(this.serial);
        broker.devices.delete(this.port);
    }

    poll() {
        if(!this.serial)
            return;
        const time = process.hrtime();
        if(time[0] > this.lastReceiveTime[0]+broker.disconnectTimeout) {
            this.disconnect();
            return;
        }
        const packets = serial.poll(this.serial);
        if(packets.length == 0)
            return;
        this.lastReceiveTime = time;
        const packet = packets[packets.length-1];
        if(packet.length == 16)
            this.hardwareConfigHash = packet;
        else if(packet.length == 4*6) {
            for(let i = 0; i < 2; ++i) {
                const newPosition = new Vector(packet.readFloatLE(i*12), packet.readFloatLE(i*12+4), packet.readFloatLE(i*12+8));
                if(this.lastKnownPositions[i] && newPosition.difference(this.lastKnownPositions[i]).length() <= 0.0)
                    continue;
                this.lastKnownPositions[i] = newPosition;
                this.emit('handleMoved', i, this.lastKnownPositions[i]);
            }
        }
    }

    send(packet) {
        if(this.serial)
            serial.send(this.serial, packet);
    }

    moveHandleTo(index, target) {
        this.lastTargetPositions[index] = target;
        this.emit('moveHandleTo', index, target);
        if(!this.serial) {
            this.lastKnownPositions[index] = target;
            this.emit('handleMoved', index, this.lastKnownPositions[index]);
            return;
        }
        const values = (target) ? [target.x, target.y, target.r] : [NaN, NaN, NaN],
              packet = new Buffer(1+3*4);
        packet[0] = index;
        packet.writeFloatLE(values[0], 1);
        packet.writeFloatLE(values[1], 5);
        packet.writeFloatLE(values[2], 9);
        this.send(packet);
    }

    movePantoTo(index, target){
      return new Promise (resolve => 
        {
            this.moveHandleTo(index, target);
            resolve(resolve);
        });
    }

    unblockHandle(index){
      return new Promise (resolve => 
      {
          this.unblock(index);
          resolve(resolve);
      });
    }

    unblock(index) {
      this.moveHandleTo(index);
    }
}

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


function *conditional_promise_generator(promise_list, condition_fn){
  for(var i = 0; condition_fn() && i < promise_list.length; i++) {
      yield promise_list[i]();
  }
}

function autoDetectDevices() {
    SerialPort.list(function(err, ports) {
        if(err) {
            console.error(err);
            return;
        }
        for(const port of ports)
            if(port.manufacturer && (port.manufacturer.includes('Arduino LLC') || port.manufacturer.includes('Atmel Corp. at91sam SAMBA bootloader')))
                new Device(port.comName);
    });
}
autoDetectDevices();
if(!process.env.CI){
    usb.on('attach', autoDetectDevices);
    usb.on('detach', autoDetectDevices);
}
