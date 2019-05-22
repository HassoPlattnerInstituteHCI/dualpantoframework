'use strict';

const Framework = require('../..');
const {Vector, Components} = Framework;
const {
  BoxForcefield,
  ForcefieldSampleFunctions} = Components;

Framework.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      const ho = device.addHapticObject(new Vector(0, -100));
      // const mesh = ho.addComponent(
      //     new Mesh([
      //       new Vector(50, -200, 0),
      //       new Vector(-50, -200, 0),
      //       new Vector(-50, -80, 0),
      //       new Vector(50, -80, 0)]));
      // ho.addComponent(new MeshCollider(mesh));
      ho.addComponent(
          new BoxForcefield(
              new Vector(50, 50),
              ForcefieldSampleFunctions
                  .directedForce
                  .bind(undefined, new Vector(0, 1))));
    }
  }
});
