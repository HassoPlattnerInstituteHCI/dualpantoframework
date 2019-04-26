'use strict';

const Framework = require('../..');
const {Vector} = Framework;

Framework.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
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
        points.push(
            center.sum(new Vector(
                radius * Math.sin(angle),
                radius * Math.cos(angle))));
      }

      setTimeout(() => {
        console.log('Adding ', points.map((x) => `${x.x} | ${x.y}`));
        for (let i = 0; i < obstacleCount; i++) {
          device.createObstacle(points, 0);
        }
      }, 1000);

      // setTimeout(() => {
      //   console.log('Dumping quadtree...');
      //   device.sendDumpQuadtree(0);
      // }, 3000);
    }
  }
});
