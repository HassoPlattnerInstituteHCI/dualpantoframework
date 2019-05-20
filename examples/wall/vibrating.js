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

const alpha = 0.75;
let movementVector = new Vector(0,0,0);
const vibrating = function(position, lastPosition){
  const movement = position.difference(lastPosition);
  if(movement.length() > 0.5){
    const negativeForce = movementVector.scaled(alpha).sum(movement.scaled(1-alpha));
    movementVector = movement;
    return new Vector(-negativeForce.x, -negativeForce.y, NaN).scale(0.6);
  }
  return new Vector(0,0,0);
}

function start(){
  device.on('handleMoved', function(index, position){
  });
  let force = device.createForcefield(forcefield, vibrating, 0);
}
