'use strict';

const Offset = require('polygon-offset');
const Collider = require('./collider');
const Mesh = require('./mesh');
const MeshTrigger = require('./meshTrigger');
const Vector = require('../vector');
const HandleMovement = require('./handleMovement');

/**
 * @description Abstract case class for all HardStep types. Don't create an
 * instance of this class. Works by creating and two triggers which are
 * offsetted based on the specified strengths.
 * @extends Collider - Internally, this is an collider, which may be toggled
 * off when the required force is reached.
 */
class HardStep extends Collider {
  /**
   * @private This is an internal function.
   * @description Creates a new forcefield.
   * @param {number} enterStrength - The strength needed to get into the box.
   * Useful values are from 0 to 5.
   * @param {number} leaveStrength - The strength needed to get into the box.
   * Useful values are from 0 to 5.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0.
   */
  constructor(enterStrength, leaveStrength, handles) {
    super(handles || 0);
    this.enterStrength = enterStrength;
    this.leaveStrength = leaveStrength;
  }

  /**
   * @private This is an internal function.
   * @description Initializes the component. Don't call this method -
   * this will automatically happen when adding the component to a HapticObject.
   */
  init() {
    const randomScale = 1e-10;
    const array = this.mesh.path.map((v) => [
      v.x + Math.random() * randomScale,
      v.y + Math.random() * randomScale
    ]);
    array.push(array[0]);
    const offset = new Offset();

    if (this.enterStrength > 0) {
      try {
        const enterPoly = offset.data(array).padding(this.enterStrength)[0];
        this.enterMesh = new Mesh(
            enterPoly.map((v) => new Vector(v[0], v[1])), this.handles);
      } catch (exception) {
        console.log(
            'Could not offset enter trigger for HardStep.',
            'Setting enter trigger equal to collider.',
            'This may happen if the specified area is too small.',
            'Problematic mesh:', this.mesh.path,
            '\nError:', exception);
        this.enterMesh = new Mesh(this.mesh.path);
      }
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
      try {
        const leavePoly = offset.data(array).margin(this.leaveStrength)[0];
        this.leaveMesh = new Mesh(
            leavePoly.map((v) => new Vector(v[0], v[1])), this.handles);
      } catch (exception) {
        console.log(
            'Could not offset leave trigger for HardStep.',
            'Setting leave trigger equal to collider.',
            'Problematic mesh:', this.mesh.path,
            '\nError:', exception);
        this.leaveMesh = new Mesh(this.mesh.path);
      }
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

  /**
   * @private This is an internal function.
   * @description Update the component with one handle's movement. Updates the
   * internal triggers, which may toggle off the obstacle for a short moment.
   * @param {HandleMovement} handleMovement - The handle's
   * movement.
   */
  updatePosition(handleMovement) {
    this.enterTrigger.updatePosition(handleMovement);
    this.leaveTrigger.updatePosition(handleMovement);
  }

  /**
   * @private This is an internal function.
   * @description Toggles off the internal obstacle for a short moment.
   */
  tcl() {
    this.disable();
    setTimeout(() => this.enable(), 5);
  }
}

module.exports = HardStep;
