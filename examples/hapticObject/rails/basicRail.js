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
        if (lastPos[index] && Math.abs(lastPos[index].x) > Math.abs(pos[index].x)) {
          f = pos[index].x; // force needs to be negative on the left side of the rail and positive on the right side
        }
        // const f = 0 - pos[index].x;
        if (pos[index].x>0 && pos[index].x<3 ) {
          device.applyForceTo(index, new Vector(f, 0));
        } else {
          device.applyForceTo(index, new Vector(0, 0));
        }
        lastPos[index] = pos[index];
      });
    }
  }
});
