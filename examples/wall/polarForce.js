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

const centerPoint = new Vector(0, -150, 0);
const polar = function(position, lastPosition){
  const forceDirection = centerPoint.difference(position).normalized();
  return forceDirection.scaled(1);
}

function start(){
  device.on('handleMoved', function(index, position){
  });
  let force = device.createForcefield(forcefield, polar, 0);
}
