'use strict';


const child_process = require('child_process'),
      fs = require('fs'),
      path = require('path'),
      serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./Vector.js'),
      say = require('say-promise'),
      PlaySound = require('play-sound')(),
      TWEEN = require('@tweenjs/tween.js'),
      co = require('co');

let upperPanto, lowerPanto;

class PantoConnector {
  constructor(usbpath, TUTORIAL_LANGUAGE){
        this.usbpath = usbpath;
        this.connect();
        this.serialRecv();
        this.TUTORIAL_LANGUAGE = TUTORIAL_LANGUAGE;
      }

  run_script(promise_list) {
        this._running_script = true;
        var script_generator = conditional_promise_generator(promise_list, () => this._running_script);
        co(script_generator)
        .catch(console.log)
    }

  movePantoTo(index, target) {
    const values = (target) ? [target.x, target.y, target.r] : [NaN, NaN, NaN],
          data = new Buffer(1+3*4);
    data[0] = index;
    data.writeFloatLE(values[0], 1);
    data.writeFloatLE(values[1], 5);
    data.writeFloatLE(values[2], 9);
    serial.send(data);
  }

  movePantoTo(index, target, duration, interpolation_method=TWEEN.Easing.Quadratic.Out)
  {
      return new Promise (resolve => 
      {
          this.movePantoFunction(index, target, duration, interpolation_method);
          resolve(resolve);
      });
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

  playSound(filename) {
  }

  waitMS(ms) {
      return new Promise(resolve => setTimeout(() => resolve(resolve), ms));
  }

  connect(){
    try{
      serial.open(this.usbpath);
    } catch (e) {
        console.log("ERROR: No serial port attached.");
        if (DEBUG_WITHOUT_SERIAL)
        {
            console.log("DEBUG: DEBUG_WITHOUT_SERIAL is true, so running with SERIAL_EXISTS=false.");
            SERIAL_EXISTS = false;
        }
    }
  }

  serialRecv() {
    setImmediate(serialRecv);
    const packets = serial.poll();
    if(packets.length == 0)
        return;
    const packet = packets[packets.length-1];
    if(packet.length != 4*6)
        return;

    const values = [];
    for(let i = 0; i < 6; ++i)
        values[i] = packet.readFloatLE(i*4);
    upperPanto = new Vector(values[0], values[1], values[2]);
    lowerPanto = new Vector(values[3], values[4], values[5]);
  }

  unblock() {
    this.movePantoTo(0);
    this.movePantoTo(1);
  }

  getLowerPantoPos() {
    return lowerPanto;
  } 

  getUpperPantoPos() {
    return upperPanto;
  }

  animateTween() {
    TWEEN.update();
    if(tween_stack_counter > 0) {
        setTimeout(this.animateTween, TWEEN_INTERVAL);
    }
  }
};