'use strict';

const Framework = require('./Framework.js'),
      Vector = require('./Vector.js');

Framework.on('devicesChanged', function(devices) {
    for(const device of devices) {
        device.on('handleMoved', function(index, position) {
            console.log('handleMoved', index, position);
        });
        // device.moveHandleTo(0, new Vector(0, -80, 0));
        // device.moveHandleTo(1, new Vector(0, -80, 0));
    }
});

// TODO: Test case termination
setTimeout(function() {
    process.exit(0);
}, 1000);