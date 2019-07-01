'use strict';

const Trigger = require('./trigger');
const Vector = require('../vector');
const Box = require('./box');

/**
 * @description Rectangular trigger, centered at the HapticObject's position.
 * May either be used with or without a box collider. If used with a collider,
 * startTouch/touch/endTouch events are emitted, otherwise enter/inside/leave
 * events are emitted.
 * @emits enter - The handle moved into the trigger zone.
 * @emits inside - The handle is inside the trigger zone.
 * @emits leave - The handle left the trigger zone.
 * @emits startTouch - The handle started touching the collider.
 * @emits touch - The handle is touching the collider.
 * @emits endTouch - The handle stopped touching the collider.
 * @extends Trigger
 */
class BoxTrigger extends Trigger {
  /**
   * @description Creates a new BoxTrigger with the given size.
   * @param {Vector} size - The size of the created box.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Trigger).
   */
  constructor(size, handles) {
    super(handles);
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

module.exports = BoxTrigger;
