const DualPantoFramework = require('./../../.');
const {Vector} = DualPantoFramework;

let device;
let forcefield = [new Vector(-400, -30, NaN), new Vector(400, -30, NaN), new Vector(400, -200, NaN), new Vector(-400, -200, NaN)];
DualPantoFramework.on('devicesChanged', function(devices){
  for(const newdevice of devices){
    if(!device){
      device = newdevice
      start();
    }
  }
});


const rails = function(position, lastPosition){
  let force = 0;
  if(position.x < 0){
    force = (position.x % 20) + 10;
  }else{
    force = (position.x % 20) - 10;
  }
  return new Vector(-force*0.2, 0, NaN);
}

function start(){
  device.on('handleMoved', function(index, position){
  });
  let force = device.createForcefield(forcefield, rails, 0);
}
