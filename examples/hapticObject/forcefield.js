'use strict';

const Framework = require('../..');
const {Vector, Components, Broker} = Framework;
const {
  Mesh,
  MeshForcefield,
  BoxForcefield,
  ForcefieldSampleFunctions} = Components;

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
          // adding a box forcefield around (-100|-100) pushing to the right
          // this uses the predefined directed force funtion,
          // setting the 0th (this) and 1st argument (direction) using bind
          const leftHapticObject = device.addHapticObject(
              new Vector(-100, -100));
          leftHapticObject.addComponent(
              new BoxForcefield(
                  new Vector(100, 100),
                  ForcefieldSampleFunctions.directedForce.bind(
                      undefined,
                      new Vector(1, 0))));
          // adding a mesh forcefield around (100|-100) pushing to the left
          // this uses a custom callback function (also just directed force)
          const rightHapticObject = device.addHapticObject(
              new Vector(100, -100));
          const mesh = rightHapticObject.addComponent(
              new Mesh([
                new Vector(-50, -50, 0),
                new Vector(-50, 50, 0),
                new Vector(50, 50, 0),
                new Vector(50, -50, 0)]));
          rightHapticObject.addComponent(
              new MeshForcefield(
                  mesh,
                  (position, lastPosition) => new Vector(-1, 0)));
        }
      }
    });
