'use strict';

const Framework = require('./Framework.js'),
      Vector = require('./Vector.js');

Framework.on('devicesChanged', function(devices) {
    for(const device of devices) {
        device.on('handleMoved', function(index, position) {
            console.log('handleMoved', index, position);
        });
        function sendSignal(){
            device.moveHandleTo(0, new Vector(100*Math.random(),100*Math.random(), 0));
            device.moveHandleTo(1, new Vector(100*Math.random(),100*Math.random(), 0));
            setTimeout(() => {sendSignal();}, 1000);
        }
        sendSignal();
    }
});

// TODO: Test case termination
setTimeout(function() {
    process.exit(0);
}, 1000);
 

//{"type":"moveHandleTo","id":0,"pos":{"x":0,"y":-80,"r":0}}
