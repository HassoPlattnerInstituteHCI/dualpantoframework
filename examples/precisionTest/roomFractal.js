'use strict';

const Framework = require('./../../');
const {Vector} = Framework;

/**
 *
 * @param {Vector[]} path - array where the points will be added
 * @param {boolean} leftToBottom - true if the room should have a door at the
 * left and bottom; false if the doors should be at the top and right
 * @param {number} startX - x-position to start the room generation with
 * @param {number} startY - y-position to start the room generation with
 * @param {number} wallLength - width and height of the room
 * @param {number} steps - how many rooms should be generated recursively
 */
function generateRoom(
    path,
    leftToBottom,
    startX,
    startY,
    wallLength,
    steps) {
  if (steps < 1) return;

  const l3 = wallLength / 3;
  const l4 = wallLength / 4;

  if (leftToBottom) {
    path.push(new Vector(startX, startY)); // next to entrance
    path.push(new Vector(startX, startY - l4)); // corner bottom left
    path.push(new Vector(startX + l3, startY - l4)); // next to exit

    generateRoom(
        path,
        !leftToBottom,
        startX + l3,
        startY - l4 - l3,
        l3 * 2,
        steps-1
    );

    // next to exit
    path.push(new Vector(startX + l3 * 2, startY - l4));
    // corner bottom right
    path.push(new Vector(startX + wallLength, startY - l4));
    // corner top right
    path.push(new Vector(startX + wallLength, startY - l4 + wallLength));
    // corner top left
    path.push(new Vector(startX, startY - l4 + wallLength));
    // next to entrance
    path.push(new Vector(startX, startY + 2 * l4));
  } else {
    // next to entrance
    path.push(new Vector(startX, startY));
    // corner top left
    path.push(new Vector(startX - l4, startY));
    // corner bottom left
    path.push(new Vector(startX - l4, startY - wallLength));
    // corner bottom right
    path.push(new Vector(startX - l4 + wallLength, startY - wallLength));
    // next to exit
    path.push(new Vector(startX - l4 + wallLength, startY - wallLength + l3));

    generateRoom(
        path,
        !leftToBottom,
        startX - l4 + wallLength + l3,
        startY - wallLength + l3,
        l3 * 2,
        steps-1
    );

    // next to exit
    path.push(new Vector(startX - l4 + wallLength, startY - l3));
    // corner top right
    path.push(new Vector(startX - l4 + wallLength, startY));
    // next to entrance
    path.push(new Vector(startX + 2 * l4, startY));
  }
}

Framework.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      Framework.run_script([
        // () => device.movePantoTo(0, new Vector(-20, -100, NaN), 30),
        () => {
          return new Promise((resolve) => {
            setTimeout( () => {
              const path = [];
              generateRoom(path, false, -30, -80, 50, 4);
              let minX = 10000;
              let maxX = -10000;
              let minY = 10000;
              let maxY = -10000;
              console.log(
                  '(%s,%s) (%s,%s)',
                  minX.toFixed(1),
                  minY.toFixed(1),
                  maxX.toFixed(1),
                  maxY.toFixed(1)
              );

              console.log(path);

              let out = '';
              for (const p of path) {
                out += p.x.toFixed(2) + '|' + p.y.toFixed(2) + ' ';
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
              }
              console.log(out);

              device.createObstacle(path, 0);
            }, 3000);
          });
        }
      ]);
    }
  }
});
