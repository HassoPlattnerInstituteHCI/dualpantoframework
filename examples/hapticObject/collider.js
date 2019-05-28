'use strict';

const Framework = require('../..');
const {Vector, Components} = Framework;
const {
  Mesh,
  MeshCollider,
  BoxCollider} = Components;

Framework.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      // adding a simple box collider around (-100|-100)
      const leftHapticObject = device.addHapticObject(new Vector(-100, -100));
      leftHapticObject.addComponent(new BoxCollider(new Vector(100, 100)));
      // adding a mesh collider around (100|-100) - in this case, also a box
      const rightHapticObject = device.addHapticObject(new Vector(100, -100));
      const mesh = rightHapticObject.addComponent(
          new Mesh([
            new Vector(-50, -50, 0),
            new Vector(-50, 50, 0),
            new Vector(50, 50, 0),
            new Vector(50, -50, 0)]));
      rightHapticObject.addComponent(new MeshCollider(mesh));
    }
  }
});