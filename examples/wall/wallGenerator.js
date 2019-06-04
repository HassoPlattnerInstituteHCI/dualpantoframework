'use strict';

const Framework = require('../..');
const {Vector, Components, Broker} = Framework;
const {
  Mesh,
  MeshCollider} = Components;

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
          const center = new Vector(0, -90);
          const radius = 30;
          let pointCount = parseInt(process.argv[2]);
          if (isNaN(pointCount)) pointCount = 10;
          let obstacleCount = parseInt(process.argv[3]);
          if (isNaN(obstacleCount)) obstacleCount = 1;

          const points = [];

          for (let i = 0; i < pointCount; i++) {
            const angle = 2 * Math.PI * i / pointCount;
            points.push(new Vector(
                radius * Math.sin(angle),
                radius * Math.cos(angle)));
          }

          setTimeout(() => {
            console.log('Adding ', points.map((x) => `${x.x} | ${x.y}`));
            for (let i = 0; i < obstacleCount; i++) {
              const hapticObject = device.addHapticObject(center);
              const mesh = hapticObject.addComponent(new Mesh(points));
              hapticObject.addComponent(new MeshCollider(mesh));
            }
          }, 1000);
        }
      }
    });
