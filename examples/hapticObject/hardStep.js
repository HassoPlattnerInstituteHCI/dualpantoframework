'use strict';

const Framework = require('../..');
const {Vector, Components} = Framework;
const {
  Mesh,
  MeshHardStep,
  BoxHardStep} = Components;

Framework.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      // adding a box hard step around (-100|-100) keeping the user out
      const leftHapticObject = device.addHapticObject(new Vector(-100, -100));
      leftHapticObject.addComponent(
          new BoxHardStep(new Vector(100, 100), 3, 0));
      // adding a mesh hard step around (100|-100) keeping the user in
      const rightHapticObject = device.addHapticObject(new Vector(100, -100));
      const mesh = rightHapticObject.addComponent(
          new Mesh([
            new Vector(-50, -50, 0),
            new Vector(-50, 50, 0),
            new Vector(50, 50, 0),
            new Vector(50, -50, 0)]));
      rightHapticObject.addComponent(
          new MeshHardStep(mesh, 0, 3));
    }
  }
});
