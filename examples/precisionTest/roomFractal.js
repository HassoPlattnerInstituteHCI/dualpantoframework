'use strict';

const Framework = require('./../../');
const {Vector, Components, Broker} = Framework;
const {
  Mesh,
  MeshCollider} = Components;

/**
 * @description Generates rooms recursively.
 * @param {Vector[]} path - Array where the points will be added.
 * @param {boolean} leftToBottom - True if the room should have a door at the
 * left and bottom; false if the doors should be at the top and right.
 * @param {number} startX - X-position to start the room generation with.
 * @param {number} startY - Y-position to start the room generation with.
 * @param {number} wallLength - Width and height of the room.
 * @param {number} steps - How many rooms should be generated recursively.
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

Broker.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      const path = [];
      generateRoom(path, false, -30, -80, 50, 4);

      const rightHapticObject = device.addHapticObject(
          new Vector(0, 0));
      const mesh = rightHapticObject.addComponent(
          new Mesh(path));
      rightHapticObject.addComponent(
          new MeshCollider(mesh));
    }
  }
});
