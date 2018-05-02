'use strict';

const serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./Vector.js'),
      SerialPort = require('serialport'),
      EventEmitter = require('events').EventEmitter,
      Obstacle = require('./obstacle'),
      co = require('co'),
      say = require('say-promise'),
      PlaySound = require('play-sound')(),
      TWEEN = require('@tweenjs/tween.js'),
      cp = require('chipmunk'),
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
const timesteps = 1.0/1000.0; //steps for chipmunk2d
const broker = new Broker();
module.exports = broker;
const ViDeb = require('./Utils/ViDeb/index');
const TWEEN_INTERVAL = 30; 
var tween_stack_counter = 0;


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
        this.obstacles = [];
        this.language = 'DE';
        this.collisionChecking = true;
        this.v = cp.v;
        this.space = new cp.Space();
        this.space.gravity = this.v(0,0);
        this.me = this.space.addBody(new cp.Body(1, cp.momentForCircle(1, 0, 2, this.v(0,0))));
        this.it = this.space.addBody(new cp.Body(1, cp.momentForCircle(1, 0, 2, this.v(0,0))));
        this.time = 0;
        this.floor = this.space.addShape(new cp.SegmentShape(this.space.staticBody, this.v(-250, -100), this.v(250, -100), 0));
        this.floor.setElasticity(1);
        this.floor.setFriction(1);
        this.floor.setLayers(NOT_GRABABLE_MASK);
    }

    disconnect() {
        if(this.onDisconnect)
            this.onDisconnect();
        serial.close(this.serial);
    }

    poll() {
        const packets = serial.poll(this.serial);
        this.space.step(this.time);
        this.time = this.time + timesteps;
        //console.log(this.me.p.x);
        let me_pos = new Vector(this.me.p.x, this.me.p.y, NaN);
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
        let distance_me_panto = this.lastKnownPositions[0].difference(me_pos);
        let distance_me_chip = this.v(distance_me_panto.x, distance_me_panto.y)
        console.log(distance_me_panto.length());
        this.me.applyForce(distance_me_panto, me_pos);
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

    createObstacle(pointArray){
      return new Promise (resolve =>
        {
          this.obstacles.push(new Obstacle(pointArray));
          resolve();
        });
    }

    colliding(point){
      for(let i = 0; i < this.obstacles.length; i++){
        if(this.obstacles[i].inside(point)){
          this.collisionChecking = false;
          return true;
        }
      }
      return false;
    }

    handleCollision(index, lastValidPosition ,newPosition){
      const force = new Vector(0, 0);
      let normal, penetration;
      var tangent = lastValidPosition.difference(newPosition);
      tangent.scale(1.5);
      var counterpoint = newPosition.sum(tangent);
      this.run_script([
        () => this.forcePantoTo(index, counterpoint),
        () => this.waitMS(100),
        () => this.unblockHandle(index),
        () => this.collisionCheckingOn(),
        ]);




      /*console.log('moving player to: ');
      console.log(point);
      this.run_script([
        () => this.movePantoTo(index, point, 50),
        () => this.waitMS(100),
        () => this.setFalse(),
        () => this.unblockHandle(index)
      ]);*/
    }

    collisionCheckingOff(){
      return new Promise (resolve =>
        {
          this.collisionChecking = false;
          resolve();
        });
    }

    collisionCheckingOn(){
      return new Promise (resolve =>
        {
          this.collisionChecking = true;
          resolve();
        });
    }

    forcePantoTo(index, target)
    {
      return new Promise (resolve => 
      {
          this.moveHandleTo(index, target);
          resolve(resolve);
      });
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
      if (this.language == "EN") {
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
