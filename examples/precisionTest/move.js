'use strict';

const Framework = require('./../../');
const {Vector, Broker} = Framework;

const positions = [new Vector(-50, -120, NaN), new Vector(50, -120, NaN)];
let nextPosition = 0;
const handle = 0;
const threshold = 10;
let wait = false;
const VoiceInteraction = Broker.voiceInteraction;

Broker.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      invokeMovement(device);
    }
  }
});

const invokeMovement = (device) => {
  nextPosition = (nextPosition + 1) % positions.length;
  device.movePantoTo(handle, positions[nextPosition]).then(
  () => VoiceInteraction.speakText('Position ' + nextPosition)).then(
  () => invokeMovement(device));
}
