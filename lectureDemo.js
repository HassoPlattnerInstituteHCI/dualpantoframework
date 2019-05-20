const DualPantoFramework = require('./.');
const {Vector} = DualPantoFramework;
const {PerformanceObserver, performance} = require('perf_hooks');
const VoiceInteraction = DualPantoFramework.voiceInteraction;
let device;

DualPantoFramework.on('devicesChanged', function(devices) {
  for (const newdevice of devices) {
    if (!device) {
      device = newdevice;
      const opn = require('opn');
      opn('http://localhost:8080/map.html');
      setTimeout(start, 3000);
    }
  }
});

const start = () => {
  //horizontal
  device.mapLine([new Vector(-45, -75, NaN), new Vector(55, -75, NaN)], 'red');
  device.mapLine([new Vector(-45, -105, NaN), new Vector(55, -105, NaN)], 'red');

  device.mapLine([new Vector(-45, -110, NaN), new Vector(55, -110, NaN)], 'red');
  device.mapLine([new Vector(-45, -140, NaN), new Vector(55, -140, NaN)], 'red');

  device.mapLine([new Vector(-45, -145, NaN), new Vector(55, -145, NaN)], 'red');
  device.mapLine([new Vector(-45, -175, NaN), new Vector(55, -175, NaN)], 'red');

  //vertikal
  device.mapLine([new Vector(-45, -75, NaN), new Vector(-45, -175, NaN)], 'red');
  device.mapLine([new Vector(-15, -75, NaN), new Vector(-15, -175, NaN)], 'red');

  device.mapLine([new Vector(-10, -75, NaN), new Vector(-10, -175, NaN)], 'red');
  device.mapLine([new Vector(20, -75, NaN), new Vector(20, -175, NaN)], 'red');

  device.mapLine([new Vector(25, -75, NaN), new Vector(25, -175, NaN)], 'red');
  device.mapLine([new Vector(55, -75, NaN), new Vector(55, -175, NaN)], 'red');

  // directed Force upperLeft
  const forcefield00 = [new Vector(-45, -75, NaN), new Vector(-15, -75, NaN),
    new Vector(-15, -105, NaN), new Vector(-45, -105, NaN)];
  const directedForce = function(position, lastPosition) {
    return new Vector(0, 2, 0);
  }
  device.createForcefield(forcefield00, directedForce, 0);

  // Funnel Object upper middle
  const forcefield01 = [new Vector(-10, -75, NaN), new Vector(15, -75, NaN),
    new Vector(20, -105, NaN), new Vector(-10, -105, NaN)];
  const centerPoint = new Vector(5, -90, 0);
  let lastTic = 0;
  let lastError = new Vector(0, 0, 0);
  let p = 0.15;
  let d = 3.5;
  const polar = function(position, lastPosition) {
    const currentTic = performance.now();
    const deltaT = currentTic - lastTic;
    let error = centerPoint.difference(position);
    let forceDirection = error.scaled(p).add(error.difference(lastError).scaled(d/deltaT));
    lastError = error;
    if(forceDirection.length() > 1){
      forceDirection = forceDirection.normalized();
    }
    lastTic = currentTic;
    return forceDirection;
  };
  device.createForcefield(forcefield01, polar, 0);

  // noise upperRight
  const forcefield02 = [new Vector(25, -75, NaN), new Vector(55, -75, NaN),
    new Vector(55, -105, NaN), new Vector(25, -105, NaN)];
  const noise = function(position, lastPosition) {
    return new Vector(Math.random() - 0.5, Math.random() - 0.5, NaN).normalized().scaled(0.2);
  };
  device.createForcefield(forcefield02, noise, 0);

  // damping middleLeft
  const forcefield10 = [new Vector(-45, -110, NaN), new Vector(-15, -110, NaN),
    new Vector(-15, -140, NaN), new Vector(-45, -140, NaN)];
  const alpha = 0.75;
  let movementVector = new Vector(0, 0, 0);
  const damping = function(position, lastPosition) {
    const movement = position.difference(lastPosition);
    if (movement.length() > 0.5) {
      const negativeForce = movementVector.scaled(alpha)
          .sum(movement.scaled(1-alpha));
      movementVector = movement;
      return new Vector(-negativeForce.x, -negativeForce.y, NaN).scale(0.6);
    }
    return new Vector(0, 0, 0);
  };
  device.createForcefield(forcefield10, damping, 0);

  // solid middleMiddle
  const forcefield11 = [new Vector(-10, -110, NaN), new Vector(20, -110, NaN),
    new Vector(20, -140, NaN), new Vector(-10, -140, NaN)];
  device.createObstacle(forcefield11, 0);

  // bumper middleRight
  const forcefield12 = [new Vector(25, -110, NaN), new Vector(55, -110, NaN),
    new Vector(55, -140, NaN), new Vector(25, -140, NaN)];
  const bumper = function(position, lastPosition) {
    return new Vector(0, 0, 0);
  };
  device.createForcefield(forcefield12, bumper, 0);

  // climable lowerleft
  // const forcefield20 = [new Vector(-45, -160, NaN),
  // new Vector(-15, -160, NaN), new Vector(-15, -190, NaN)
  // , new Vector(-45, -190, NaN)];
  const obsSize = [new Vector(-40, -150, NaN), new Vector(-20, -150, NaN), new Vector(-20, -170, NaN), new Vector(-40, -170, NaN)];
  const subfield0 = [new Vector(-39, -151, NaN), new Vector(-21, -151, NaN), new Vector(-21, -169, NaN), new Vector(-39, -169, NaN)];
  const subfield1 = [new Vector(-45, -145, NaN), new Vector(-15, -145, NaN), new Vector(-17, -147, NaN), new Vector(-43, -147, NaN)];
  const subfield2 = [new Vector(-15, -145, NaN), new Vector(-15, -175, NaN), new Vector(-17, -173, NaN), new Vector(-17, -147, NaN)];
  const subfield3 = [new Vector(-15, -175, NaN), new Vector(-45, -175, NaN), new Vector(-43, -173, NaN), new Vector(-17, -173, NaN)];
  const subfield4 = [new Vector(-45, -175, NaN), new Vector(-45, -145, NaN), new Vector(-43, -147, NaN), new Vector(-43, -198, NaN)];
  const obs = device.createObstacle(obsSize, 0);
  device.createTriggerfield(subfield0, obs, 0);
  device.createTriggerfield(subfield1, obs, 0);
  device.createTriggerfield(subfield2, obs, 0);
  device.createTriggerfield(subfield3, obs, 0);
  device.createTriggerfield(subfield4, obs, 0);
  const sounddemo1 = device.createSoundfield(subfield0, 0);
  let player;
  sounddemo1.on('entered', () => {
    player = VoiceInteraction.playSound('./Sounds/siren.mp3', true);
  });
  sounddemo1.on('left', () => {
    if(player){
      player.stop();
    }
  });
  // damping lower middle
  const lowerMiddle = [new Vector(-10, -145, NaN), new Vector(20, -145, NaN), new Vector(20, -175, NaN), new Vector(-10, -175, NaN)];
  const sizeDiff = 5;
  const pitPushUpperLeft = [lowerMiddle[0], 
                            new Vector(lowerMiddle[0].x + sizeDiff, lowerMiddle[0].y, NaN), 
                            new Vector(lowerMiddle[0].x + sizeDiff, lowerMiddle[0].y - sizeDiff, NaN), 
                            new Vector(lowerMiddle[0].x, lowerMiddle[0].y - sizeDiff, NaN)];

  const pitPushUpperRight = [lowerMiddle[1], 
                            new Vector(lowerMiddle[1].x - sizeDiff, lowerMiddle[1].y, NaN), 
                            new Vector(lowerMiddle[1].x - sizeDiff, lowerMiddle[1].y - sizeDiff, NaN), 
                            new Vector(lowerMiddle[1].x, lowerMiddle[1].y - sizeDiff, NaN)];

  const pitPushLowerRight = [lowerMiddle[2], 
                            new Vector(lowerMiddle[2].x - sizeDiff, lowerMiddle[2].y, NaN), 
                            new Vector(lowerMiddle[2].x - sizeDiff, lowerMiddle[2].y + sizeDiff, NaN), 
                            new Vector(lowerMiddle[2].x, lowerMiddle[2].y + sizeDiff, NaN)];

  const pitPushLowerLeft = [lowerMiddle[3], 
                            new Vector(lowerMiddle[3].x + sizeDiff, lowerMiddle[3].y, NaN), 
                            new Vector(lowerMiddle[3].x + sizeDiff, lowerMiddle[3].y + sizeDiff, NaN), 
                            new Vector(lowerMiddle[3].x, lowerMiddle[3].y + sizeDiff, NaN)];

  const pitPushUpperMiddle = [new Vector(lowerMiddle[0].x + sizeDiff, lowerMiddle[0].y, NaN),
                              new Vector(lowerMiddle[1].x - sizeDiff, lowerMiddle[1].y, NaN),
                              new Vector(lowerMiddle[1].x - sizeDiff, lowerMiddle[1].y - sizeDiff, NaN),
                              new Vector(lowerMiddle[0].x + sizeDiff, lowerMiddle[0].y -sizeDiff, NaN)];

  const pitPushLowerMiddle = [new Vector(lowerMiddle[3].x + sizeDiff, lowerMiddle[3].y, NaN),
                              new Vector(lowerMiddle[2].x - sizeDiff, lowerMiddle[2].y, NaN),
                              new Vector(lowerMiddle[2].x - sizeDiff, lowerMiddle[2].y + sizeDiff, NaN),
                              new Vector(lowerMiddle[3].x + sizeDiff, lowerMiddle[3].y + sizeDiff, NaN)];

  const pitPushLeftMiddle = [new Vector(lowerMiddle[0].x, lowerMiddle[0].y - sizeDiff, NaN),
                              new Vector(lowerMiddle[0].x + sizeDiff, lowerMiddle[0].y - sizeDiff, NaN),
                              new Vector(lowerMiddle[3].x + sizeDiff, lowerMiddle[3].y + sizeDiff, NaN),
                              new Vector(lowerMiddle[3].x, lowerMiddle[3].y + sizeDiff, NaN)];

  const pitPushRightMiddle = [new Vector(lowerMiddle[1].x - sizeDiff, lowerMiddle[1].y - sizeDiff, NaN),
                              new Vector(lowerMiddle[1].x, lowerMiddle[1].y - sizeDiff, NaN),
                              new Vector(lowerMiddle[2].x, lowerMiddle[2].y + sizeDiff, NaN),
                              new Vector(lowerMiddle[2].x - sizeDiff, lowerMiddle[2].y + sizeDiff, NaN)];

  const inside = [new Vector(lowerMiddle[0].x + sizeDiff, lowerMiddle[0].y - sizeDiff, NaN),
                  new Vector(lowerMiddle[1].x - sizeDiff, lowerMiddle[1].y - sizeDiff, NaN),
                  new Vector(lowerMiddle[2].x - sizeDiff, lowerMiddle[2].y + sizeDiff, NaN),
                  new Vector(lowerMiddle[3].x + sizeDiff, lowerMiddle[3].y + sizeDiff, NaN),];
  /*for(let i = 0; i < 4; i++){
    device.mapLine([pitPushLeftMiddle[i], pitPushLeftMiddle[i + 1 > 3 ? 0 : i + 1]], 'green');
  }
  for(let i = 0; i < 4; i++){
    device.mapLine([pitPushRightMiddle[i], pitPushRightMiddle[i + 1 > 3 ? 0 : i + 1]], 'yellow');
  }
  for(let i = 0; i < 4; i++){
    device.mapLine([pitPushUpperRight[i], pitPushUpperRight[i + 1 > 3 ? 0 : i + 1]], 'blue');
  }
  for(let i = 0; i < 4; i++){
    device.mapLine([pitPushLowerRight[i], pitPushLowerRight[i + 1 > 3 ? 0 : i + 1]], 'black');
  }*/
  const conerForceUpperLeft = (position, lastPosition) =>{
    const conerForceUpperLeft = pitPushUpperLeft[2].difference(position);
    return conerForceUpperLeft.scaled(0.4);
  }

  const conerForceUpperRight = (position, lastPosition) =>{
    const conerForceUpperRight = pitPushUpperRight[2].difference(position);
    return conerForceUpperRight.scaled(0.4);
  }

  const conerForceLowerRight = (position, lastPosition) =>{
    const conerForceLowerRight = pitPushLowerRight[2].difference(position);
    return conerForceLowerRight.scaled(0.4);
  }

  const conerForceLowerLeft = (position, lastPosition) =>{
    const conerForceLowerLeft = pitPushLowerLeft[2].difference(position);
    return conerForceLowerLeft.scaled(0.4);
  }

  const middleLeft = (position, lastPosition) => {
    return new Vector(1, 0, 0);
  }
  const middleRight = (position, lastPosition) => {
    return new Vector(-1, 0, 0);
  }
  const middleDown = (position, lastPosition) => {
    return new Vector(0, 1, 0);
  }
  const middleUp = (position, lastPosition) => {
    return new Vector(0, -1, 0);
  }
  device.createForcefield(pitPushUpperLeft, conerForceUpperLeft, 0);
  device.createForcefield(pitPushUpperRight, conerForceUpperRight, 0);
  device.createForcefield(pitPushLowerRight, conerForceLowerRight, 0);
  device.createForcefield(pitPushLowerLeft, conerForceLowerLeft, 0);
  device.createForcefield(pitPushUpperMiddle, middleUp, 0);
  device.createForcefield(pitPushRightMiddle, middleRight, 0);
  device.createForcefield(pitPushLowerMiddle, middleDown, 0);
  device.createForcefield(pitPushLeftMiddle, middleLeft, 0);
  const sounddemo2 = device.createSoundfield(inside, 0);
  sounddemo2.on('entered', () => {
    VoiceInteraction.playSound('./Sounds/fight-reaction-person_1.wav', false);
  });

  // outerWall lower Right
};
