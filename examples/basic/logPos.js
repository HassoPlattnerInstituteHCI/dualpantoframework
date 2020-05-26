'use strict';

const {Broker, Vector} = require('../..');

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      const pos = [new Vector(), new Vector()];
      device.on('handleMoved', function(index, position) {
        pos[index] = position;
        // eslint-disable-next-line require-jsdoc
        function format(number) {
          const sign = number >= 0 ? '+' : '-';
          const abs = Math.abs(number);
          const whole = (abs / 1000).toFixed(3).substring(2, 5);
          const remainder = (abs % 1).toFixed(3).substring(1, 5);
          return sign + whole + remainder;
        }
        if (index == 0) {
          console.log(
              '[me] ', format(pos[0].x), '|', format(pos[0].y),
              '|', '[r ] ', format(pos[0].r * 180 / Math.PI),
              '[it] ', format(pos[1].x), '|', format(pos[1].y));
        }
      });
    }
  }
});
