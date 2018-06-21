'use strict';

const DualPantoFramework = require('.'),
      {Vector} = DualPantoFramework;

DualPantoFramework.on('devicesChanged', function(devices, attached, detached) {
    console.log(devices, attached, detached);
    for(const device of devices) {
        device.on('handleMoved', function(index, position) {
            console.log(device.port, 'handleMoved', index, position);
        });
        device.setPantoPID(2, 0, 0.01);
        device.setHandlePID(0.25, 0, 0.01);
        device.moveHandleTo(0, new Vector(20, -80, 0));
        device.moveHandleTo(1, new Vector(20, -80, 0));
    }
});

// TODO: Test case termination
setTimeout(function() {
    process.exit(0);
}, 1000);
