'use strict';

const Framework = require('../../Framework.js'),
      Vector = require('../../Vector.js');

let device;
Framework.on('devicesChanged', function(devices, attached, detached) {
    console.log(devices, attached, detached);
    for(const _device of devices) {
        if(!device){
            device = _device;
            start();
        }
    }
});

function start(){
    device.on('handleMoved', (idx, pos)=>{
       let f = - (pos.y - (-80))/7.0;
       f = f < 0 ? 0 : f;
       device.applyForceTo(idx, new Vector(0,f,0));
    });
}
