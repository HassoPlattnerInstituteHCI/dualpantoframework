/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const DualPantoFramework = require('../../../lib/dualpantoframework');
const {Vector, Broker, Components, open} = DualPantoFramework;
const {Mesh, MeshTrigger, MeshCollider, BoxForcefield} = Components;
const VoiceInteraction = Broker.voiceInteraction;

const {scene1} = require('./scenes');
/**
 * @type {import('../../../lib/device')}
 */
let device;

const stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

Broker.on('devicesChanged', function(devices) {
  for (const newdevice of devices) {
    if (!device) {
      device = newdevice;
      open('http://localhost:8080/map.html');
      setTimeout(start, 1000);
    }
  }
});

function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

// TODO: move this into the vector class
function pDistance(x, y, x1, y1, x2, y2) {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq != 0) {
    param = dot / lenSq;
  }

  let xx; let yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// behaves like a rail which sucks the handle in
const negativeLogarithmicRails = function(distToRail, maxForce, range) {
  let force = 0;
  const multiplicator = distToRail > 0 ? -1 : 1;
  force = (-getBaseLog(range, Math.abs(distToRail)) + 1) * maxForce
    * multiplicator;
  if (distToRail > -1 && distToRail < 1) {
    force = maxForce * multiplicator;
    // force = 0;
  }
  return force;
};


// behave like a bump with a sharp edge at the position of the rail
const negativeLogarithmicBump = function(distToRail, maxForce, range) {
  let force = 0;
  const multiplicator = distToRail > 0 ? 1 : -1;
  force = (-getBaseLog(range, Math.abs(distToRail)) + 1) * maxForce
    * multiplicator;
  if (distToRail > -1 && distToRail < 1) {
    force = 0;
  }
  return force;
};

// behave like a "male" bump with a sharp edge at the position of the rail
// but with a linear incline
const linearInclineRails = function(distToRail, maxForce, range) {
  const multiplicator = distToRail > 0 ? 1 : -1;
  return -1 * (multiplicator * (-(maxForce / range) * Math.abs(distToRail))
    + (multiplicator * maxForce));
};

// behave like a "male" bump with a sharp edge at the position of the rail
// without incline of force
const squareRails = function(distToRail, force, range) {
  const multiplicator = distToRail < 0 ? 1 : -1;
  return multiplicator * force;
};

// a "female" bump that physically has the shape of a half pipe (or a "u") and
// keeps the user between 2 bumps
const halfpipeBumb = function(distToRail, maxForce, range) {
  return Math.pow(-distToRail, 3) * maxForce / Math.pow(range, 3);
};

// for "male" bump rails that should not push the
// user away once they overcame the bump
const softTail = function(distToRail, maxForce, range) {
  // x > 0 means that we pushed to the right and hence need negative force
  const multiplicator = distToRail >= 0 ? -1 : 1;
  // the m in the formula m * x^2 + n
  if (Math.abs(distToRail) < range / 2) {
    return 0;
    const m = -multiplicator * maxForce / Math.pow(range, 2);
    return - (m * Math.pow(distToRail, 2) + multiplicator * maxForce);
  } else {
    return 0;
  }
};

// trigger the current rail function using keyboard presses
const railFunctions = {
  '1': negativeLogarithmicBump,
  '2': linearInclineRails,
  '3': negativeLogarithmicRails,
  '4': halfpipeBumb,
  '5': squareRails
};

let railFunc = negativeLogarithmicRails;
let softTailActive = false;

stdin.on('data', function(key) {
  // ctrl-c ( end of text )
  if (key === '\u0003') {
    process.exit();
  }
  if (key === 'x') {
    softTailActive = !softTailActive;
    console.log('Soft tail active', softTailActive);
  }
  if (key in railFunctions) {
    railFunc = railFunctions[key];
  }
  console.log(railFunc);
});


const getDistToRail = function(position, rail) {
  const sideOfRail = (position.x - rail[0].x) * (rail[1].y - rail[0].y) -
  (position.y - rail[0].y) * (rail[1].x - rail[0].x) > 0 ? 1 : -1;
  return sideOfRail * pDistance(position.x, position.y,
      rail[0].x, rail[0].y,
      rail[1].x, rail[1].y);
};

const rails = function(position, lastPosition) {
  const rails = [
    [new Vector(-40, -150), new Vector(-5, -70)],
    [new Vector(40, -150), new Vector(5, -70)]];
  const force = new Vector(0, 0, NaN);
  const forceFactor = 0.01;
  const maxForce = 40; // railFunc === negativeLogarithmicRails ? 15 : 5;
  const range = 3;
  for (let r = 0; r < rails.length; r++) {
    const rail = rails[r];
    const railVec = rail[1].subtract(rail[0]);
    const railOrthogonal = new Vector(-railVec.y, railVec.x);
    const railOrthogonalDir = railOrthogonal.normalized();
    const distToRail = getDistToRail(position, rail);
    if (Math.abs(distToRail) < range) {
      let railForce = railFunc(distToRail, maxForce, range);

      if (softTailActive && lastPosition) {
        const lastDistToRail = getDistToRail(lastPosition, rail);
        // we pushed over the rail
        if ((distToRail - lastDistToRail) / distToRail > 0) {
          railForce = softTail(distToRail, maxForce, range / 2);
          // railForce = 0;
          // return new Vector(0, 0, NaN);
          // console.log('Force after soft tail application', railForce);
        }
      }
      console.log('Force', railForce);
      railForce *= forceFactor;
      const forceVec = railOrthogonalDir.scale(railForce);
      force.add(forceVec);
    }
  }
  return force;
};

function processTrial(trialId, trialsForBlock, durations) {
  // console.log('trials for block: ', trialsForBlock.length);

  trial = trialsForBlock[trialId];
  console.log(trial);
  const handle = 1;
  startPos = new Vector(parseInt(trial.starting_x), parseInt(trial.starting_y));
  // startPos = new Vector(20, -67);
  Broker.runScript([
    () => device.movePantoTo(handle, startPos, 100),
    () => Broker.waitMS(1000),
    () => VoiceInteraction.speakText('3, 2, 1, Go', 'EN'),
    () => device.unblockHandle(handle)]);
  // device.moveHandleTo(0, startPos);

  console.log('Moved me handle to', startPos);
  const target = device.addHapticObject(
      new Vector(parseInt(trial.target_x), parseInt(trial.target_y)));

  const mesh = target.addComponent(
      new Mesh([
        new Vector(-5, 0, 0),
        new Vector(0, -5, 0),
        new Vector(5, 0, 0),
        new Vector(0, 5, 0)]));
  const trigger = target.addComponent(
      new MeshTrigger(mesh, handle));
  target.addComponent(
      new MeshCollider(mesh, handle));
  console.log(trigger);
  let objectFound = false;
  trigger.on(
      'startTouch',
      () => {
        if (!objectFound) {
          objectFound = true;
          console.log('Found object of interest');
          durations.push(Date.now() - startTime);
          console.log('Experiment duration', Date.now() - startTime);
          // object destroy
          VoiceInteraction.speakText('Found power up', 'EN').then(() =>{
            const nextTrialId = parseInt(trialId)+1;
            if (nextTrialId<trialsForBlock.length) {
              processTrial(nextTrialId.toString(), trialsForBlock, durations);
            } else {
              device.disconnect();
              console.log('Please rate how you perceived the agency during the last 5 trials:');
            }
          });
        }
      });
  if (trial.cond == 'rail') {
    console.log('adding rails');
    const hapticObject = device.addHapticObject(new Vector(0, -100));
    hapticObject.addComponent(new BoxForcefield(new Vector(200, 100), rails, handle));
  }

  const startTime = Date.now();
}

function start() {
  scene1(device);

  // read csv from cmd param
  if (process.argv.length > 2) {
    studyProtocol = process.argv[2];
    const csv = require('csv-parser');
    const fs = require('fs');
    const protocol = [];
    fs.createReadStream(studyProtocol)
        .pipe(csv())
        .on('data', (row) => {
          // protocol = {...protocol, row}
          // console.log(Object.keys(row));
          protocol.push(row);
        })
        .on('end', () => {
          console.log('CSV file successfully processed');
          console.log(protocol);
          const blockId = '0';
          const trialsForBlock = protocol.filter((obj) => {
            return obj['block_id'] === blockId;
          });
          processTrial(0, trialsForBlock, []);
        });
  } else {
    // const hapticObject = device.addHapticObject(new Vector(0, -100));
    // hapticObject.addComponent(new BoxForcefield(new Vector(200, 100), rails, 1));
  }

  /*  for (let j=0;j<numIterations;j++){
    for(let i=0; i<numTrials; i++){

      // play 3,2,1 sound
      // start time stopping
      wait for trigger of object being "found"
      play sound for found target
      stop time and add to array of durations
      //clear scene
    }
    //questionnaire in console
    // write csv out
  }
  //
  */
}
