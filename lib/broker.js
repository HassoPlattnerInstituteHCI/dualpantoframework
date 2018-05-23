'use strict';

const EventEmitter = require('events').EventEmitter,
      co = require('co');

const VoiceInteraction = require('./voice-interaction');
const Device = require('./device');

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

function *conditional_promise_generator(promise_list, condition_fn){
  for(var i = 0; condition_fn() && i < promise_list.length; i++) {
      yield promise_list[i]();
  }
}

module.exports = Broker;
