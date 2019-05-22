'use strict';

const Framework = require('../..');
const {Vector, Components} = Framework;
const {
  Mesh,
  MeshCollider,
  MeshForcefield,
  MeshTrigger,
  BoxTrigger,
  ForcefieldSampleFunctions} = Components;

Framework.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      // left: triangle forcefield
      const lho = device.addHapticObject(new Vector(-100, -100));
      const lm = lho.addComponent(
          new Mesh([
            new Vector(0, 25, 0),
            new Vector(25, -25, 0),
            new Vector(-25, -25, 0)]));
      lho.addComponent(
          new MeshForcefield(lm, ForcefieldSampleFunctions.noise));
      // center: square trigger area
      const cho = device.addHapticObject(new Vector(0, -100));
      const ct = cho.addComponent(new BoxTrigger(new Vector(50, 50)));
      ct.on('enter', () => console.log('ct enter'));
      ct.on('inside', () => console.log('ct inside'));
      ct.on('leave', () => console.log('ct leave'));
      ct.on('startTouch', () => console.log('ct startTouch'));
      ct.on('touch', () => console.log('ct touch'));
      ct.on('endTouch', () => console.log('ct endTouch'));
      // right: triangle obstacle with trigger area
      const rho = device.addHapticObject(new Vector(100, -100));
      const rm = rho.addComponent(
          new Mesh([
            new Vector(0, 25, 0),
            new Vector(25, -25, 0),
            new Vector(-25, -25, 0)]));
      rho.addComponent(new MeshCollider(rm));
      const rt = rho.addComponent(new MeshTrigger(rm));
      rt.on('enter', () => console.log('rt enter'));
      rt.on('inside', () => console.log('rt inside'));
      rt.on('leave', () => console.log('rt leave'));
      rt.on('startTouch', () => console.log('rt startTouch'));
      rt.on('touch', () => console.log('rt touch'));
      rt.on('endTouch', () => console.log('rt endTouch'));
    }
  }
});
