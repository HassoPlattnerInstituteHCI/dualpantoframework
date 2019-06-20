'use strict';

const Trigger = require('./trigger');
const Vector = require('../vector');

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
    this.halfSize = size.scaled(0.5);
  }

  /**
   * @private This is an internal function.
   * @description Checks if the given point is inside the box.
   * @param {Vector} position - Point to check.
   * @return {boolean} True if the point is inside, false otherwise.
   */
  contains(position) {
    const offset = this.hapticObject.position;
    return position.x > offset.x - this.halfSize.x &&
      position.y > offset.y - this.halfSize.y &&
      position.x < offset.x + this.halfSize.x &&
      position.y < offset.y + this.halfSize.y;
  }
}

module.exports = BoxTrigger;
