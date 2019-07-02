'use strict';

const Forcefield = require('./forcefield');
const Vector = require('../vector');
const ForcefieldCallback = require('./forcefieldCallback');
const Box = require('./box');

/**
 * @description Rectangular forcefield, centered at the HapticObject's position.
 * @extends Forcefield
 */
class BoxForcefield extends Forcefield {
  /**
   * @description Creates a new BoxForcefield with the given size.
   * @param {Vector} size - The size of the created box.
   * @param {ForcefieldCallback} callback - The function calculating the force
   * applied inside the forcefield. Parameters are the current and previous
   * god object positions.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Forcefield).
   */
  constructor(size, callback, handles) {
    super(callback, handles);
    this.size = size;
  }

  /**
   * @private This is an internal function.
   * @description Initializes the component. Don't call this method -
   * this will automatically happen when adding the component to a HapticObject.
   */
  init() {
    this.traceableObject = new Box(this.size);
    this.traceableObject.hapticObject = this.hapticObject;
  }
}

module.exports = BoxForcefield;
