'use strict';

const Framework = require('./Framework.js'),
      Vector = require('./Vector.js');

Framework.onDevicesChanged = function(devices) {
    for(const device of devices) {
        device.onHandleMoved = function(index, position) {
            console.log('onHandleMoved', index, position);
        };
        // device.moveHandleTo(0, new Vector(0, -80, 0));
    }
};

// TODO: Test case termination
setTimeout(function() {
    process.exit(0);
}, 1000);
