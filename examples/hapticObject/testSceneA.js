'use strict';

const Framework = require('../..');
const {Vector, Components} = Framework;
const {
  Mesh,
  MeshCollider,
  BoxCollider,
  BoxForcefield,
  ForcefieldSampleFunctions} = Components;

Framework.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      const ho = device.addHapticObject(new Vector(0, -100));
      const mesh = ho.addComponent(
          new Mesh([
            new Vector(25, -25, 0),
            new Vector(25, 25, 0),
            new Vector(75, 25, 0),
            new Vector(75, -25, 0)]));
      ho.addComponent(new MeshCollider(mesh));
      ho.addComponent(
          new BoxForcefield(
              new Vector(50, 50),
              ForcefieldSampleFunctions
                  .directedForce
                  .bind(undefined, new Vector(0, 1))));
      const ho2 = device.addHapticObject(new Vector(-50, -100));
      ho2.addComponent(new BoxCollider(new Vector(50, 50)));
    }
  }
});
