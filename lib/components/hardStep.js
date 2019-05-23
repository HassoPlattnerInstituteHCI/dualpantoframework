/* eslint-disable require-jsdoc */
const Offset = require('polygon-offset');
const Collider = require('./collider');
const Mesh = require('./mesh');
const MeshTrigger = require('./meshTrigger');
const Vector = require('../vector');

class HardStep extends Collider {
  constructor(enterStrength, leaveStrength, handles) {
    super(handles || 0);
    this.enterStrength = enterStrength;
    this.leaveStrength = leaveStrength;
  }

  init() {
    const array = this.mesh.path.map((v) => [v.x, v.y]);
    array.push(array[0]);
    const offset = new Offset();

    if (this.enterStrength > 0) {
      const enterPoly = offset.data(array).padding(this.enterStrength)[0];
      this.enterMesh = new Mesh(
          enterPoly.map((v) => new Vector(v[0], v[1])), this.handles);
    } else {
      this.enterMesh = new Mesh(this.mesh.path);
    }

    this.enterTrigger = new MeshTrigger(this.enterMesh, this.handles);
    this.enterTrigger.hapticObject = this.hapticObject;
    this.enterTrigger.on('startTouch', (inside) => {
      if (!inside) {
        this.tcl();
      }
    });

    if (this.leaveStrength > 0) {
      const leavePoly = offset.data(array).margin(this.leaveStrength)[0];
      this.leaveMesh = new Mesh(
          leavePoly.map((v) => new Vector(v[0], v[1])), this.handles);
    } else {
      this.leaveMesh = new Mesh(this.mesh.path);
    }

    this.leaveTrigger = new MeshTrigger(this.leaveMesh, this.handles);
    this.leaveTrigger.hapticObject = this.hapticObject;
    this.leaveTrigger.on('startTouch', (inside) => {
      if (inside) {
        this.tcl();
      }
    });
  }

  updatePosition(handleMovement) {
    this.enterTrigger.updatePosition(handleMovement);
    this.leaveTrigger.updatePosition(handleMovement);
  }

  tcl() {
    this.disable();
    setTimeout(() => this.enable(), 5);
  }
}

module.exports = HardStep;
