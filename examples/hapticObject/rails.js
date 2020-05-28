/* eslint-disable require-jsdoc */
const DualPantoFramework = require('../..');
const {Vector, Broker, Components} = DualPantoFramework;
const {BoxForcefield} = Components;

/**
 * @type {import('../../lib/device')}
 */
let device;

Broker.on('devicesChanged', function(devices) {
  for (const newdevice of devices) {
    if (!device) {
      device = newdevice;
      start();
    }
  }
});

function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}


// behave like a bump with a sharp edge at the position of the rail
const negativeLogarithmicRails = function(x, maxForce, range) {
  let force = 0;
  if (x < 0 && x >= -range || x > 0 && x <= range) {
    const multiplicator = x < 0 ? -1 : 1;
    force = (-getBaseLog(10, x * multiplicator) + 1) * maxForce * multiplicator;
    if (x > -1 && x < 1) {
      force = maxForce * multiplicator;
      // force = 0;
    }
  }
  return force;
};

// behave like a "masculine" bump with a sharp edge at the position of the rail but with a linear incline
const linearInclineRails = function(x, maxForce, range) {
  let force = 0;
  const multiplicator = x < 0 ? -1 : 1;
  if (x > - range && x < range) {
    force = multiplicator * (-multiplicator * (maxForce/range)*x + maxForce);
  }

  return force;
};

// behave like a "masculine" bump with a sharp edge at the position of the rail without incline of force
const squareRails = function(x, force, range) {
  const multiplicator = x < 0 ? -1 : 1;
  if (x > - range && x < range) {
    return multiplicator * force;
  } else {
    return 0;
  }
};

// a "feminine" bump that physically has the shape of a half pipe (or a "u") and keeps the user between 2 bumps
const halfpipeBumb = function(x, maxForce, range) {
  if (x > - range && x < range) {
    return Math.pow(-x, 3)*maxForce/Math.pow(range, 3);
  }
  return 0;
};

// for "masculine" bump rails that should not push the user away once they overcame the bump
const softTail = function(x, maxForce, range) {
  // x > 0 means that we pushed to the right and hence need negative force
  const multiplicator = x >= 0 ? -1 : 1;

  // the m in the formula m * x^2 + n
  const m = -multiplicator * maxForce/Math.pow(range, 2);
  if (Math.abs(x) < range) {
    return (m * Math.pow(x, 2) + multiplicator * maxForce);
  }
  return 0;
};

const rails = function(position, lastPosition) {
  let force = 0;
  const maxForce = 30;
  const range = 10;

  // add different kinds of bumps to test various haptic rails
  force = negativeLogarithmicRails(position.x, maxForce, range);
  // force = linearInclineRails(position.x, maxForce, range);
  // force = squareRails(position.x, 20, 5);

  // this means that we move away from/already passed the bump
  // add soft tail (decline of force according to quadratic/negative quadratic curve)
  if (lastPosition && (position.x-lastPosition.x)/position.x>0) {
    force = softTail(position.x, maxForce, range/2);
  }

  // force = halfpipeBumb(position.x, 20, 3);
  console.log(force);

  return new Vector(force*0.01, 0, NaN);
};

function start() {
  const hapticObject = device.addHapticObject(new Vector(0, -100));
  hapticObject.addComponent(new BoxForcefield(new Vector(400, 200), rails));
}
