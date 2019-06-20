'use strict';

const EventEmitter = require('events').EventEmitter;
const co = require('co');

const VoiceInteraction = require('./voice-interaction');
const Device = require('./device');

/**
 * @description Class for device handling and basic functions.
 * @extends EventEmitter
 */
class Broker extends EventEmitter {
  /**
   * @description Create a Broker object.
   */
  constructor() {
    super();
    this.devices = new Map();
    this.prevDevices = new Set();
    this.disconnectTimeout = 5; // Seconds
    this.voiceInteraction = new VoiceInteraction();
  }
  /**
   * @description Creates a script that executes a list of promises.
   * @param {Array} promiseList - Array of functions which return promises.
   */
  runScript(promiseList) {
    this.runningScript = true;
    const scriptGenerator =
        conditionalPromiseGenerator(promiseList, () => this.runningScript);
    co(scriptGenerator)
        .catch(console.log);
  }
  /**
   * @description Generates a promise that creates a timeout.
   * @param {number} ms - Number ob ms to wait.
   * @return {Promise} The promise executing the timeout.
   */
  waitMS(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(resolve), ms));
  }
  /**
   * @description Returns all connected devices.
   * @return {Set<Device>} The connected devices.
   */
  getDevices() {
    return new Set(this.devices.values());
  }
  /**
   * @description Returns the device connected to a specific port.
   * @param {string} port - The port of the device.
   * @return {Device} The connected device.
   */
  getDeviceByPort(port) {
    return this.devices.get(port);
  }
  /**
   * @description Creates a new virtual device.
   * @return {Device} The new virtual device.
   */
  createVirtualDevice() {
    return new Device('virtual');
  }
}

// eslint-disable-next-line require-jsdoc
function* conditionalPromiseGenerator(promiseList, conditionFunction) {
  for (let i = 0; conditionFunction() && i < promiseList.length; i++) {
    yield promiseList[i]();
  }
}

const broker = new Broker();

module.exports = {
  broker
};
