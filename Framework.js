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
      TWEEN = require('@tweenjs/tween.js'),
      TWEEN_INTERVAL = 30,
      VoiceCommand = require('./voice-command');

let tween_stack_counter = 0;

/** Class for voice input and output 
* @extends EventEmitter
*/
class VoiceInteraction extends EventEmitter{
  /**
  * Create a Voiceinteraction object.
  */
  constructor(){
    super();
    this.voiceCommand;
  }
  /**
   * Speaks a text.
   * @param {String} txt - The text to speak.
   * @param {String} [language=DE] - The language to speak.
   * @param {number} [speed=1.4] - The speed that is spoken with.
   */
  speakText(txt, language = 'DE', speed = 1.4) {
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
    /**
     * Creates a script which speaks a german text with 1.4 speed.
     * @param {String} txt - The text to speak.
     */
    sayText(txt) {
      this.run_script([
        () => this.speakText(txt)
      ]);
    }

    playSound(filename) {
      console.log('play sound is not implemented yet');
    }

    /**
     * Sets up the voice input listener.
     * @param {array} commands - List of Strings to listen for.
     */
    setCommands(commands){
      this.voiceCommand = new VoiceCommand(commands);
      this.voiceCommand.on('command', function(command) {
        console.log('Keyword Recognized: ',command);
        this.emit('keywordRecognized', command);
      }.bind(this));
    }
    /**
     * starts the listener.
     */
    beginListening(){
      return new Promise (resolve => 
      {
        this.voiceCommand.startListening();
        resolve(resolve);
      });
    }
    /**
     * stops the listener.
     */
    haltListening(){
      return new Promise (resolve => 
      {
        this.voiceCommand.stopListening();
        resolve(resolve);
      });
    }
}

/** Class for device handling and basic functions
* @extends EventEmitter
*/
class Broker extends EventEmitter {
    /**
    * Create a Brocker object.
    */
    constructor() {
        super();
        this.devices = new Map();
        this.prevDevices = new Set();
        this.disconnectTimeout = 5; // Seconds
        this.voiceInteraction = new VoiceInteraction();
    }
    /**
     * Creates a script that executes a list of promises.
     * @param {array} promise_list - the list of promises to execute.
     */
    run_script(promise_list) {
        this._running_script = true;
        var script_generator = conditional_promise_generator(promise_list, () => this._running_script);
        co(script_generator)
        .catch(console.log);
    }
    /**
     * Generates a promise that creates a timeout.
     * @param {number} ms - number ob ms to wait.
     * @return {Promise} The promise executing the timeout.
     */    
    waitMS(ms) {
        return new Promise(resolve => setTimeout(() => resolve(resolve), ms));
    }
    /**
     * Returns all connected devices.
     * @return {Set} The connected devices.
     */ 
    getDevices() {
        return new Set(this.devices.values());
    }
    /**
     * Returns the device connected to a specific port
     * @param {String} port - the port of the device
     * @return {Device} The connected device.
     */
    getDeviceByPort(port) {
        return this.devices.get(port);
    }
    /**
     * Creates a new virtual device
     * @return {Device} The new virtual device.
     */
    createVirtualDevice() {
        return new Device('virtual');
    }
}
const broker = new Broker();
module.exports = broker;
const ViDeb = require('./Utils/ViDeb/index');


/** Class for panto interaction.
* @extends EventEmitter
*/
class Device extends EventEmitter {
    /**
     * Creates a new device.
     * @param {String} port - port on that the device is connected.
     */
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
        this.lastKnownPositions[0] = new Vector(0,0,0);
        this.lastKnownPositions[1] = new Vector(0,0,0);
        this.lastTargetPositions = [];
        this.lastReceiveTime = process.hrtime();
        broker.devices.set(this.port, this);
        if(this.serial)
            this.serial = serial.open(this.port);
    }
    /**
     * Disconnect the device.
     */
    disconnect() {
        if(this.serial)
            serial.close(this.serial);
        broker.devices.delete(this.port);
    }
    /**
     * Pulls new data from serial connection and handles them.
     */
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
    /**
     * Sends a packet via the serial connection to the panto.
     * @param {Buffer} packet - the packet to send
     */
    send(packet) {
        if(this.serial)
            serial.send(this.serial, packet);
    }

    /**
     * sets new positions if handles are moved by ViDeb
     * @param {number} index - index of moved handle
     * @param {Vector} position - position the handle was moved to
     */
    handleMoved(index, position) {
        position = new Vector(position.x, position.y, position.r);
        this.emit('handleMoved', index, position);
    }

    /**
     * moves a Handle to a position
     * @param {number} index - index of handle to move
     * @param {Vector} target - position the handle should be moved to
     */
    moveHandleTo(index, target) {
        this.lastTargetPositions[index] = target;
        this.emit('moveHandleTo', index, target);
        if(!this.serial) {
            this.lastKnownPositions[index] = target;
            this.emit('moveHandleTo', index, this.lastKnownPositions[index]);
            return;
        }
        const values = (target) ? [target.x, target.y, target.r] : [NaN, NaN, NaN],
              packet = new Buffer(1+1+3*4);
        packet[0] = 0; //control method : position = 0;
        packet[1] = index;
        packet.writeFloatLE(values[0], 2);
        packet.writeFloatLE(values[1], 6);
        packet.writeFloatLE(values[2], 10);
        this.send(packet);
    }

    /**
     * applies force vector to the pantograph
     * @param {number} index - index of handle to apply force
     * @param {Vector} target - vector of force to render. 3rd element will be ignored.
     */
    applyForceTo(index, force) {
        this.emit('applyForceTo', index, force);
        if(!this.serial){
            return;
        }
        const values = (force) ? [force.x, force.y, 0] : [NaN, NaN, NaN],
              packet = new Buffer(1+1+3*4);
        packet[0] = 255; //control method : position = 1;
        packet[1] = index;
        packet.writeFloatLE(values[0], 2);
        packet.writeFloatLE(values[1], 6);
        packet.writeFloatLE(values[2], 10);
        this.send(packet);
    }

    /**
     * Returns a promise that invokes handle movement with tween behaviour
     * @param {number} index - index of handle to move
     * @param {Vector} target - position the handle should be moved to
     * @param {number} [duration=500] - time in ms that the movement shall take.
     * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.Out] - tween function that is used to generate the movement.
     * @return {promise} the promise executing the movement
     */
    movePantoTo(index, target, duration = 500, interpolation_method = TWEEN.Easing.Quadratic.Out) {
        return new Promise (resolve => 
        {
            this.tweenPantoTo(index, target, duration, interpolation_method);
            resolve(resolve);
        });
    }

    /**
     * Returns a promise that unblocks a handle
     * @param {number} index - index of handle to unblock
     * @return {promise} the promise executing the unblock
     */
    unblockHandle(index){
        return new Promise (resolve => 
        {
            this.unblock(index);
            resolve(resolve);
        });
    }

    /**
     * Unblocks a handle
     * @param {number} index - index of handle to unblock
     */
    unblock(index) {
      this.moveHandleTo(index);
    }
    
    /**
     * Moves a handle with tween movement behaviour
     * @param {number} index - index of handle to move
     * @param {Vector} target - position the handle should be moved to
     * @param {number} [duration=500] - time in ms that the movement shall take.
     * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.Out] - tween function that is used to generate the movement.
     */
    tweenPantoTo(index, target, duration = 500, interpolation_method = TWEEN.Easing.Quadratic.Out) {
        let tweenPosition = undefined;
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

        let tween = new TWEEN.Tween(tweenPosition) // Create a new tween that modifies 'tweenPosition'.
            .to(target, duration)
            .easing(interpolation_method) // Use an easing function to make the animation smooth.
            .onUpdate(() => { // Called after tween.js updates 'tweenPosition'.
                this.moveHandleTo(index, tweenPosition);
            })
            .onComplete(() => {
                tween_stack_counter--;
            })
            .start(); // Start the tween immediately.
        }
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

function animateTween() {
    TWEEN.update();
    if(tween_stack_counter > 0) {
        setTimeout(animateTween, TWEEN_INTERVAL);
    }
}

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
if(!process.env.CI){
    usb.on('attach', autoDetectDevices);
    usb.on('detach', autoDetectDevices);
}
