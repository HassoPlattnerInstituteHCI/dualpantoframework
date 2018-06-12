'use strict'

const   DualPantoFramework = require('.'),
		VoiceInteraction = DualPantoFramework.voiceInteraction,
        {Vector} = DualPantoFramework;

DualPantoFramework.on('devicesChanged', function(devices) {
    for(const device of devices) {
        start(device);
    }
});

function start(device) {
    VoiceInteraction.speakText("Willkommen zu Homefinder");
}
