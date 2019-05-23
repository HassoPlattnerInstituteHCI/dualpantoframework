'use strict';

const Framework = require('../..');
const {Vector, Components} = Framework;
const {
  Mesh,
  MeshForcefield,
  BoxForcefield,
  ForcefieldSampleFunctions} = Components;

Framework.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      // adding a box forcefield around (-100|-100) pushing to the right
      // this uses the predefined directed force funtion,
      // setting the 0th (this) and 1st argument (direction) using bind
      const leftHapticObject = device.addHapticObject(new Vector(-100, -100));
      leftHapticObject.addComponent(
          new BoxForcefield(
              new Vector(100, 100),
              ForcefieldSampleFunctions.directedForce.bind(
                  undefined,
                  new Vector(1, 0))));
      // adding a mesh forcefield around (100|-100) pushing to the left
      // this uses a custom callback function (also just directed force)
      const rightHapticObject = device.addHapticObject(new Vector(100, -100));
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
