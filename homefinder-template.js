'use strict'

const   DualPantoFramework = require('./Framework.js'),
		VoiceInteraction = DualPantoFramework.voiceInteraction
        Vector = require('./Vector.js');

DualPantoFramework.on('devicesChanged', function(devices) {
    for(const device of devices) {
        start(device);
    }
});

function start(device) {
    VoiceInteraction.speakText("Welcome to Homefinder"); // "Willkommen zu Homfinder"
}
