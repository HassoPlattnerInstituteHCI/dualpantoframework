'use strict';

const serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./Vector.js'),
      SerialPort = require('serialport'),
      EventEmitter = require('events').EventEmitter,
      co = require('co'),
      say = require('say-promise'),
      PlaySound = require('play-sound')(),
      VoiceCommand = require('./voice-command');

class Broker extends EventEmitter {
    constructor() {
        super();
        this.devices = new Map();
        this.voiceCommand;
    }

    run_script(promise_list) {
      var script_generator = conditional_promise_generator(promise_list, () => true);
      co(script_generator)
      .catch(console.log)
    }

    speakText(txt, language='DE', speed=1.4) {
      var speak_voice = "Anna";
      if (language == "EN") {
          speak_voice = "Alex";
      }
      this.emit('saySpeak', txt);
      return say.speak(txt, speak_voice, speed, (err) => {
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
        return this.devices.values();
    }
}
const broker = new Broker();
module.exports = broker;
const ViDeb = require('./Utils/ViDeb/index');


class Device extends EventEmitter {
    constructor(port) {
        if(process.platform == 'darwin') // macOS
            port = port.replace('/tty.', '/cu.');
        else if(port!='ViDeb' && process.platform == 'win32') // windows
            port = '//.//'+port;
        if(broker.devices.has(port))
            return broker.devices.get(port);
        super();
        broker.devices.set(port, this);
        this.port = port;
        if(port!='ViDeb')this.serial = serial.open(port);
        this.lastKnownPositions  = [];
        this.lastTargetPositions = [];
        this.obstacles = [];
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
        if(this.port!='ViDeb')this.send(packet);
        this.emit('moveHandleTo', index, target);
    }

    movePantoTo(index, target){
      return new Promise (resolve => 
        {
            this.moveHandleTo(index, target);
            resolve(resolve);
        });
    }

    resetDevice(){
        broker.emit('devicesChanged', broker.devices.values());
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

function *conditional_promise_generator(promise_list, condition_fn){
  for(var i = 0; condition_fn() && i < promise_list.length; i++) {
      yield promise_list[i]();
  }
}


function serialRecv() {
    setImmediate(serialRecv);
    for(const device of broker.devices.values())
        if(device.port!='ViDeb')device.poll();
}
serialRecv();

function autoDetectDevices() {
    SerialPort.list(function(err, ports) {
        if(err)
            console.error(err);
        else{
            for(const port of ports){
              if(port && port.manufacturer && (port.manufacturer.includes('Arduino LLC') || port.manufacturer.includes('Atmel Corp. at91sam SAMBA bootloader'))){
                  console.log('connected to : '+port.comName);
                  new Device(port.comName);
              }
            }
            broker.emit('devicesChanged', broker.devices.values());
        }
    });
}

setTimeout(() => {
    new Device('ViDeb');
    broker.emit('devicesChanged', broker.devices.values());
}, 100);

autoDetectDevices();