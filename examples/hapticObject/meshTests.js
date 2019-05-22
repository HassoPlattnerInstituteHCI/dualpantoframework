'use strict';

const Framework = require('../..');
const {Vector, Components} = Framework;
const {
  Mesh,
  MeshForcefield,
  ForcefieldSampleFunctions} = Components;

Framework.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      const ho = device.addHapticObject(new Vector(-100, -100));
      const mesh = ho.addComponent(
          new Mesh([
            new Vector(0, -25, 0),
            new Vector(25, 25, 0),
            new Vector(-25, 25, 0)]));
      ho.addComponent(
          new MeshForcefield(
              mesh,
              ForcefieldSampleFunctions.noise));
    }
  }
});
