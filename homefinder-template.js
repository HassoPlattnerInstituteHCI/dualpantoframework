'use strict'

const   DualPantoFramework = require('./Framework.js'),
        Vector = require('./Vector.js');

DualPantoFramework.on('devicesChanged', function(devices) {
    for(const device of devices) {
        start(device);
    }
});

function start(device) {
    device.speakText("Welcome to Homefinder"); // "Willkommen zu Homfinder"
}
