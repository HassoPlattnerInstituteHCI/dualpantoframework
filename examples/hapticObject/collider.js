'use strict';

const Framework = require('../..');
const {Vector, Components, Broker, HapticObject} = Framework;
const {
  Mesh,
  MeshCollider,
  BoxCollider} = Components;

/**
 * @typedef {import('../../lib/device')} Device
 */

Broker.on('devicesChanged',
    /**
     * @description React to connected or disconnected devices.
     * @param {Device[]} devices - Connected devices.
     * @param {Device[]} attached - Newly connected devices.
     * @param {Device[]} detached - Disconencted devices.
     */
    function(devices, attached, detached) {
      for (const device of devices) {
        if (device) {
          // adding a simple box collider around (-100|-100)
          const leftHapticObject =
            device.addHapticObject(new Vector(-100, -100));
          leftHapticObject.addComponent(new BoxCollider(new Vector(100, 100)));
          // adding a mesh collider around (100|-100) - in this case, also a box
          const rightHapticObject =
            device.addHapticObject(new Vector(100, -100));
          const mesh = rightHapticObject.addComponent(
              new Mesh([
                new Vector(-50, -50, 0),
                new Vector(-50, 50, 0),
                new Vector(50, 50, 0),
                new Vector(50, -50, 0)]));
          rightHapticObject.addComponent(new MeshCollider(mesh));
          const ho = new HapticObject(new Vector());
          ho.a;
        }
      }
    });
