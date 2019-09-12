'use strict';

const Framework = require('../..');
const {Vector, Components, Broker} = Framework;
const {BoxCollider} = Components;

Broker.on('devicesChanged',
    /**
     * @description React to connected or disconnected devices.
     * @param {import('../../lib/device')[]} devices - Connected devices.
     * @param {import('../../lib/device')[]} attached - Newly connected devices.
     * @param {import('../../lib/device')[]} detached - Disconnected devices.
     */
    function(devices, attached, detached) {
      for (const device of devices) {
        if (device) {
          const upperHapticObject = device.addHapticObject(
              new Vector(0, -50));
          upperHapticObject.addComponent(
              new BoxCollider(new Vector(100, 50)));
          const lowerHapticObject = device.addHapticObject(
              new Vector(0, -101));
          lowerHapticObject.addComponent(
              new BoxCollider(new Vector(100, 50)));
        }
      }
    });
