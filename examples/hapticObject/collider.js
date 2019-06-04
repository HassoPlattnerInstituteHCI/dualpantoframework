'use strict';

const Framework = require('../..');
const {Vector, Components, Broker} = Framework;
const {
  Mesh,
  MeshCollider,
  BoxCollider} = Components;

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
          // adding a simple box collider around (-100|-100)
          const leftHapticObject = device.addHapticObject(
              new Vector(-100, -100));
          leftHapticObject.addComponent(
              new BoxCollider(new Vector(100, 100)));
          // adding a mesh collider around (100|-100) - in this case, also a box
          const rightHapticObject = device.addHapticObject(
              new Vector(100, -100));
          const mesh = rightHapticObject.addComponent(
              new Mesh([
                new Vector(-50, -50, 0),
                new Vector(-50, 50, 0),
                new Vector(50, 50, 0),
                new Vector(50, -50, 0)]));
          rightHapticObject.addComponent(
              new MeshCollider(mesh));
        }
      }
    });
