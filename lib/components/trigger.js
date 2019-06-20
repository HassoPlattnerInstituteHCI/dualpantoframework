'use strict';

const Component = require('./component');
const HandleMovement = require('./handleMovement');

/**
 * @description Abstract case class for all trigger types. May either be used
 * with or without a collider of the same type. If used with a collider,
 * startTouch/touch/endTouch events are emitted, otherwise enter/inside/leave
 * events are emitted.
 * @emits enter - The handle moved into the trigger zone.
 * @emits inside - The handle is inside the trigger zone.
 * @emits leave - The handle left the trigger zone.
 * @emits startTouch - The handle started touching the collider.
 * @emits touch - The handle is touching the collider.
 * @emits endTouch - The handle stopped touching the collider.
 * @extends Component
 */
class Trigger extends Component {
  /**
   * @private This is an internal function.
   * @description Creates a new forcefield.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should be applied to. Defaults to 0.
   */
  constructor(handles) {
    super(handles || 0);
    this.positionInside = false;
    this.godObjectInside = false;
  }

  /**
   * @private This is an internal function.
   * @description Update the component with one handle's movement. Uses the
   * contains funtion defined by subclasses if the god object position and the
   * actual physical position, as well as their old values, are inside the
   * trigger zone and emits the correct events.
   * @param {HandleMovement} handleMovement - The handle's
   * movement.
   */
  updatePosition(handleMovement) {
    const positionInside = this.contains(handleMovement.newPosition);
    const godObjectInside = this.contains(handleMovement.newGodObjectPosition);

    const enter = !this.godObjectInside && godObjectInside;
    const inside = godObjectInside;
    const leave = this.godObjectInside && !godObjectInside;

    const touch = positionInside != godObjectInside;
    const lastTouch = this.positionInside != this.godObjectInside;
    const startTouch = !lastTouch && touch;
    const endTouch = lastTouch && !touch;

    if (enter) this.emit('enter');
    if (inside) this.emit('inside');
    if (leave) this.emit('leave');
    if (startTouch) this.emit('startTouch', inside);
    if (touch) this.emit('touch', inside);
    if (endTouch) this.emit('endTouch', inside);

    this.positionInside = positionInside;
    this.godObjectInside = godObjectInside;
  }
}

module.exports = Trigger;
