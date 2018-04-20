'use strict';

const serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./Vector.js'),
      SerialPort = require('serialport'),
      EventEmitter = require('events').EventEmitter,
      WebsocketClient = require('websocket').client;

class Broker extends EventEmitter {
    constructor() {
        super();
        this.devices = new Map();
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
        else if(process.platform == 'win32') // windows
            port = '//.//'+port;
        if(broker.devices.has(port))
            return broker.devices.get(port);
        super();
        broker.devices.set(port, this);
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
        this.send(packet);
        this.emit('moveHandleTo', index, target);
    }

    movePantoTo(index, target, duration, interpolation_method=TWEEN.Easing.Quadratic.Out)
    {
      return new Promise (resolve => 
      {
          this.tweenPantoTo(index, target, duration, interpolation_method);
          resolve(resolve);
      });
    }

    tweenPantoTo(index, target, duration, interpolation_method=TWEEN.Easing.Quadratic.Out)
    {
      
      if (duration == undefined) {
          duration = 500;
      }
      var tweenPosition = undefined;
      if (index == 0 && this.lastKnownPositions[0]) {
          tweenPosition = this.lastKnownPositions[0];
      } else if (index == 1 && this.lastKnownPositions[1]) {
          tweenPosition = this.lastKnownPositions[1];
      }
      if(tweenPosition)
      {
          tween_stack_counter++;

          if(tween_stack_counter == 1)
          {
              setTimeout(animateTween, TWEEN_INTERVAL);
          }

          var tween = new TWEEN.Tween(tweenPosition) // Create a new tween that modifies 'tweenPosition'.
              .to(target, duration)
              .easing(interpolation_method) // Use an easing function to make the animation smooth.
              .onUpdate(() => { // Called after tween.js updates 'tweenPosition'.
                  this.moveHandleTo(index, tweenPosition);
              })
              .onComplete(function() {
                  tween_stack_counter--;
              })
              .start(); // Start the tween immediately.
          }
    }

    run_script(promise_list) {
        this._running_script = true;
        var script_generator = conditional_promise_generator(promise_list, () => this._running_script);
        co(script_generator)
        .catch(console.log)
    }

    speakText(txt) {
      var speak_voice = "Anna";
      if (TUTORIAL_LANGUAGE == "EN") {
          speak_voice = "Alex";
      }
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
    }

    waitMS(ms) {
        return new Promise(resolve => setTimeout(() => resolve(resolve), ms));
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

function animateTween() {
  TWEEN.update();
  if(tween_stack_counter > 0) {
      setTimeout(animateTween, TWEEN_INTERVAL);
  }
}
}

function serialRecv() {
    setImmediate(serialRecv);
    for(const device of broker.devices.values())
        device.poll();
}
serialRecv();

function autoDetectDevices() {
    SerialPort.list(function(err, ports) {
        if(err)
            console.error(err);
        else
            for(const port of ports)
                if(port.manufacturer && (port.manufacturer.includes('Arduino LLC') || port.manufacturer.includes('Atmel Corp. at91sam SAMBA bootloader'))){
                    console.log('connected to : '+port.comName);
                    new Device(port.comName);
                }
        broker.emit('devicesChanged', broker.devices.values());
    });
}
autoDetectDevices();

var WebSocketClient = require('websocket').client;
 
var client = new WebSocketClient();
 
client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });
});
 
client.connect('ws://localhost:8080/');
