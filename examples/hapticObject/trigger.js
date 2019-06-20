'use strict';

const Framework = require('../..');
const {Vector, Components, Broker} = Framework;
const {
  Mesh,
  MeshCollider,
  MeshTrigger,
  BoxTrigger} = Components;

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
          // adding a box trigger around (-100|-100)
          // since it isn't solid, it will emit enter/inside/leave events
          const leftHapticObject = device.addHapticObject(
              new Vector(-100, -100));
          const leftTrigger = leftHapticObject.addComponent(
              new BoxTrigger(new Vector(100, 100)));
          leftTrigger.on('enter', () => console.log('left enter'));
          leftTrigger.on('inside', () => console.log('left inside'));
          leftTrigger.on('leave', () => console.log('left leave'));
          // adding a mesh trigger and mesh collider around (100|-100)
          // since it is solid, it will emit startTouch/touch/endTouch events
          // touch events contain a boolean specifying if inside the object
          const rightHapticObject = device.addHapticObject(
              new Vector(100, -100));
          const mesh = rightHapticObject.addComponent(
              new Mesh([
                new Vector(-50, -50, 0),
                new Vector(-50, 50, 0),
                new Vector(50, 50, 0),
                new Vector(50, -50, 0)]));
          rightHapticObject.addComponent(
              new MeshCollider(mesh));
          const rightTrigger = rightHapticObject.addComponent(
              new MeshTrigger(mesh));
          rightTrigger.on(
              'startTouch',
              (inside) => console.log(
                  'right startTouch from',
                  inside ? 'inside' : 'outside'));
          rightTrigger.on(
              'touch',
              (inside) => console.log(
                  'right touch from',
                  inside ? 'inside' : 'outside'));
          rightTrigger.on(
              'endTouch',
              (inside) => console.log(
                  'right endTouch from',
                  inside ? 'inside' : 'outside'));
        }
      }
    });
