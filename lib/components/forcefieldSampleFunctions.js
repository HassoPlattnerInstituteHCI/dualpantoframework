/* eslint-disable require-jsdoc */

const directedForce = function(direction, position, lastPosition) {
  // console.log('dir', direction, 'pos', position, 'old', lastPosition);
  return direction;
};

const funnel = function funnel(position, lastPosition) {
  const currentTic = performance.now();
  const deltaT = currentTic - lastTic;
  const error = centerPoint.difference(position);
  let forceDirection =
    error.scaled(p).add(error.difference(lastError).scaled(d/deltaT));
  lastError = error;
  if (forceDirection.length() > 1) {
    forceDirection = forceDirection.normalized();
  }
  lastTic = currentTic;
  return forceDirection;
};

const noise = function(position, lastPosition) {
  return new Vector(Math.random() - 0.5, Math.random() - 0.5, NaN)
      .normalized()
      .scaled(0.2);
};

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

const bumper = function(position, lastPosition) {
  return new Vector(0, 0, 0);
};

module.exports = {
  directedForce,
  funnel,
  noise,
  damping,
  bumper
};
