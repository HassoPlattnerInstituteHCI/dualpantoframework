'use strict';

const Framework = require('./../../');
const {Vector, Components, Broker} = Framework;
const {
  Mesh,
  MeshCollider} = Components;

Broker.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      const line1 = device.addHapticObject(
          new Vector(0, 0));
      const mesh1 = line1.addComponent(
          new Mesh([
            new Vector(-80, -117, 0),
            new Vector(80, -120, 0)]));
      line1.addComponent(
          new MeshCollider(mesh1));

      const line2 = device.addHapticObject(
          new Vector(0, 0));
      const mesh2 = line2.addComponent(
          new Mesh([
            new Vector(-80, -123, 0),
            new Vector(80, -120.1, 0)]));
      line2.addComponent(
          new MeshCollider(mesh2));
    }
  }
});
