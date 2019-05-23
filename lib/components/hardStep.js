/* eslint-disable require-jsdoc */
const Offset = require('polygon-offset');
const Collider = require('./collider');
const Mesh = require('./mesh');
const MeshTrigger = require('./meshTrigger');
const {Vector} = require('../..');

class HardStep extends Collider {
  constructor(enterStrenght, leaveStrength, handles) {
    super(handles || 0);
    this.enterStrenght = enterStrenght;
    this.leaveStrength = leaveStrength;
  }

  init() {
    const array = this.mesh.path.map((v) => [v.x, v.y]);
    const offset = new Offset();

    const enterPoly = offset.data(array).padding(this.enterStrenght);
    this.enterMesh = new Mesh(
        enterPoly.map((v) => new Vector(v[0], v[1])), this.handles);
    this.enterTrigger = new MeshTrigger(this.enterMesh, this.handles);
    this.enterTrigger.hapticObject = this.hapticObject;
    this.enterTrigger.on('startTouch', this.tcl);

    const leavePoly = offset.data(array).margin(this.leaveStrength);
    this.leaveMesh = new Mesh(
        leavePoly.map((v) => new Vector(v[0], v[1])), this.handles);
    this.leaveTrigger = new MeshTrigger(this.leaveMesh, this.handles);
    this.leaveTrigger.hapticObject = this.hapticObject;
    this.leaveTrigger.on('endTouch', this.tcl);
  }

  updatePosition(handleMovement) {
    this.enterTrigger.updatePosition(handleMovement);
    this.leaveTrigger.updatePosition(handleMovement);
  }

  tcl() {
    this.disable();
    this.enable();
  }
}

module.exports = HardStep;
