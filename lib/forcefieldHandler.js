/* eslint-disable require-jsdoc */
const Vector = require('./vector');

const pValue = 0.25;
// const iValue = 'notImplementedYet';
// const dValue = 'notImplementedYet';

class ForceFieldHandler {
  constructor() {
    this.position = new Vector(0, 0, 0);
    this.lastPosition = new Vector(0, 0, 0);
    this.activeForce = new Vector(0, 0, 0);
    this.forcefields = [];
    this.triggerfields = [];
    this.handlePosition = new Vector(0, 0, 0);
    this.soundfields = [];
  }

  updatePosition(position, handlePosition) {
    this.lastPosition = this.position;
    this.position = position;
    this.handlePosition = handlePosition;
    this.resolveConflicts();
    return this.activeForce;
  }

  resolveConflicts() {
    const collisions = this.checkForcefieldsCollision(this.position);
    this.activeForce = new Vector(0, 0, NaN);
    for (let i = 0; i < collisions.length; i++) {
      this.processingObstacleCollision = true;
      this.activeForce = this.activeForce.sum(collisions[i]
          .handleCollison(this.position, this.lastPosition).scale(pValue));
    }
    this.checkTriggerFields(this.handlePosition);
  }

  checkForcefieldsCollision(point) {
    const collisions = [];
    for (let i = 0; i < this.forcefields.length; i++) {
      const information = this.forcefields[i].inside(point);
      if (information[0]) {
        collisions.push(information[1]);
      }
    }
    for (let i = 0; i < this.soundfields.length; i++) {
      this.soundfields[i].inside(point);
    }
    return collisions;
  }

  checkTriggerFields(point) {
    for (let i = 0; i < this.triggerfields.length; i++) {
      this.triggerfields[i].inside(point);
    }
  }

  addForcefield(forcefield) {
    this.forcefields.push(forcefield);
  }

  addTriggerField(field) {
    this.triggerfields.push(field);
  }

  addSoundfield(field) {
    this.soundfields.push(field);
  }

  removeForcefield(forcefield) {
    const index = this.forcefields.indexOf(forcefield);
    if (index != -1) this.forcefields.splice(index, 1);
  }
}
module.exports = ForceFieldHandler;
