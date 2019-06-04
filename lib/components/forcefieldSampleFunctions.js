'use strict';

const Vector = require('../vector');

/**
 * @description Applies a static force to the handle. Please use bind to set
 * this force before creating the forcefield.
 * @example
 * ForcefieldSampleFunctions.directedForce.bind(undefined, new Vector(1, 0));
 * @param {Vector} direction - The force direction.
 * @param {Vector} position - The new god object position.
 * @param {Vector} lastPosition - The old god object position.
 * @return {Vector} The resulting force.
 */
const directedForce = function(direction, position, lastPosition) {
  return direction;
};

/**
 * @description Applies a force towards a center point to the handle. Please
 * use bind to set this point before creating the forcefield.
 * @example
 * ForcefieldSampleFunctions.directedForce.bind(undefined, new Vector(10, 10));
 * @param {Vector} centerPoint - The force target.
 * @param {Vector} position - The new god object position.
 * @param {Vector} lastPosition - The old god object position.
 * @return {Vector} The resulting force.
 */
const funnel = function funnel(centerPoint, position, lastPosition) {
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

/**
 * @description Applies a noisy force to the handle.
 * @param {Vector} position - The new god object position.
 * @param {Vector} lastPosition - The old god object position.
 * @return {Vector} The resulting force.
 */
const noise = function(position, lastPosition) {
  return new Vector(Math.random() - 0.5, Math.random() - 0.5, NaN)
      .normalized()
      .scaled(0.2);
};

/**
 * @description Dampens the user's movement by applying an opposite force.
 * @param {Vector} position - The new god object position.
 * @param {Vector} lastPosition - The old god object position.
 * @return {Vector} The resulting force.
 */
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

module.exports = {
  directedForce,
  funnel,
  noise,
  damping
};
