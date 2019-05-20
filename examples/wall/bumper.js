/* eslint-disable */
const DualPantoFramework = require('./../../.');
const {Vector} = DualPantoFramework;

let device;
let forcefield = [new Vector(-400, -100, NaN), new Vector(400, -100, NaN), new Vector(400, -200, NaN), new Vector(-400, -200, NaN)];
DualPantoFramework.on('devicesChanged', function(devices){
  for(const newdevice of devices){
    if(!device){
      device = newdevice
      start();
    }
  }
});


const bumper = function(position, lastPosition){
  return position.difference(lastPosition).normalized().scaled(6);
}

function start(){
  device.on('handleMoved', function(index, position){
  });
  let force = device.createForcefield(forcefield, bumper, 0);
}
