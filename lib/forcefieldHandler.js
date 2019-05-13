/* eslint-disable require-jsdoc */
const Vector = require('./vector');

const pValue = 0.125;
// const iValue = 'notImplementedYet';
// const dValue = 'notImplementedYet';

class ForceFieldHandler {
  constructor() {
    this.position = new Vector(0, 0, 0);
    this.lastPosition = new Vector(0, 0, 0);
    this.activeForce = new Vector(0, 0, 0);
    this.forcefields = [];
  }

  updatePosition(position) {
    this.lastPosition = this.position;
    this.position = position;
    resolveConflicts();
  }

  resolveConflicts() {
    collisions = this.checkForcefieldsCollision(this.position);
    this.activeForce = new Vector(0, 0, NaN);
    for (let i = 0; i < collisions.length; i++) {
      this.processingObstacleCollision = true;
      this.activeForce = this.activeForce.sum(collisions[i]
          .handleCollison(this.position, this.lastPosition).scale(pValue));
    }
  }

  checkForcefieldsCollision(point) {
    const collisions = [];
    for (let i = 0; i < this.forcefields.length; i++) {
      const information = this.forcefields[i].inside(point);
      if (information[0]) {
        collisions.push(information[1]);
      }
    }
    return collisions;
  }

  addForcefield(forcefield) {
    this.forcefields.push(forcefield);
  }

  removeForcefield(forcefield) {
    const index = this.forcefields.indexOf(forcefield);
    if (index != -1) this.forcefields.splice(index, 1);
  }
}
module.exports = ForceFieldHandler;
