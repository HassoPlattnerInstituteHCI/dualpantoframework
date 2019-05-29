'use strict';

const Framework = require('./../../');
const {Vector} = Framework;

const p = 0;

Framework.on('devicesChanged', function(devices, attached, detached) {
  // cant break in template string
  // eslint-disable-next-line max-len
  console.log(`devices: ${devices.size}, attached: ${attached.size}, detached: ${detached.size}`);
  for (const device of devices) {
    if (device) {
      const script = [];
      for (let i = 0; i < 100; i++) {
        script.push(() => device.movePantoTo(0, new Vector(-20, -100, 0), 60));
        script.push(() => device.movePantoTo(1, new Vector(-20, -100, 0), 60));
        script.push(() => Framework.waitMS(5000));
        script.push(
            () => device.movePantoTo(0, new Vector(20, -100, Math.PI*1), 60)
        );
        script.push(
            () => device.movePantoTo(1, new Vector(20, -100, Math.PI*1), 60)
        );
        script.push(() => Framework.waitMS(5000));
      }
      Framework.run_script(script);
    }
  }
});
