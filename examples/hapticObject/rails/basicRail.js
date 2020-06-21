'use strict';

const {Broker, Vector} = require('../../../');

Broker.on('devicesChanged', function(devices, attached, detached) {
  for (const device of devices) {
    if (device) {
      const lastPos = [];
      device.on('handleMoved', function(index, position) {
        const pos = [new Vector(), new Vector()];
        pos[index] = position;
        // we build a rail in between 2- < x < 2
        let f = 0;
        if (lastPos[index] && Math.abs(lastPos[index].x) >
        Math.abs(pos[index].x)) {
          // force needs to be < 0 on the left and > 0 on the right of the rail
          f = pos[index].x/Math.abs(pos[index].x);
        }
        // const f = 0 - pos[index].x;
        if (pos[index].x>-3 && pos[index].x<3 ) {
          device.applyForceTo(index, new Vector(f, 0));
        } else {
          device.applyForceTo(index, new Vector(0, 0));
        }
        lastPos[index] = pos[index];
      });
    }
  }
});
