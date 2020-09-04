'use strict';

const Framework = require('../..');
const {Vector, Components, Broker} = Framework;
const {
  Mesh,
  MeshHardStep,
  BoxHardStep} = Components;

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
          // adding a box hard step around (-100|-100) keeping the user out
          const leftHapticObject = device.addHapticObject(
              new Vector(-50, 30));
          leftHapticObject.addComponent(
              new BoxHardStep(new Vector(100, 100), 5, 5));
          // adding a mesh hard step around (100|-100) keeping the user in
          const rightHapticObject = device.addHapticObject(
              new Vector(100, -100));
          const mesh = rightHapticObject.addComponent(
              new Mesh([
                new Vector(-50, -50, 0),
                new Vector(-50, 50, 0),
                new Vector(50, 50, 0),
                new Vector(50, -50, 0)]));
          rightHapticObject.addComponent(
              new MeshHardStep(mesh, 1, 1));
        }
      }
    });
