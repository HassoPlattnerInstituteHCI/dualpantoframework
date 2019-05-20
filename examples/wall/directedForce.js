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

const forceValue = new Vector(0, 1, 0);

const directedForce = function(position, lastPosition){
  return forceValue.scaled(0.2);
}

function start(){
  device.on('handleMoved', function(index, position){
  });
  let force = device.createForcefield(forcefield, directedForce, 0);
}
