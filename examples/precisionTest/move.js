'use strict';

const Framework = require('./../../');
const {Vector, Broker} = Framework;

const positions = [new Vector(-50, -120, NaN), new Vector(50, -120, NaN)];
let nextPosition = 0;
const handle = 0;
const threshold = 10;
let wait = false;

Broker.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      device.movePantoTo(handle, positions[nextPosition]);
      device.on('handleMoved', function(index, position) {
        const difference =
            position.difference(positions[nextPosition]).length();
        if (!wait && difference < threshold) {
          wait = true;
          setTimeout(() => {
            nextPosition = (nextPosition + 1) % positions.length;
            device.movePantoTo(handle, positions[nextPosition]);
            wait = false;
          }, 3000);
        }
      });
    }
  }
});
