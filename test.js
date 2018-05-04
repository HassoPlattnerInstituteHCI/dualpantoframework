'use strict';

const Framework = require('./Framework.js'),
      Vector = require('./Vector.js');

Framework.on('devicesChanged', function(devices) {
    for(const device of devices) {
        device.on('handleMoved', function(index, position) {
            console.log('handleMoved', index, position);
        });
    }
});

// TODO: Test case termination
setTimeout(function() {
    process.exit(0);
}, 1000);
