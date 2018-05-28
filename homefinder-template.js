'use strict'

const   DualPantoFramework = require('lib/dualpantoframework'),
		VoiceInteraction = DualPantoFramework.voiceInteraction,
        Vector = DualPantoFramework.Vector;

DualPantoFramework.on('devicesChanged', function(devices) {
    for(const device of devices) {
        start(device);
    }
});

function start(device) {
    VoiceInteraction.speakText("Willkommen zu Homefinder");
}
