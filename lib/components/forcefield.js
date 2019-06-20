'use strict';

const Component = require('./component');
const ForcefieldCallback = require('./forcefieldCallback');
const HandleMovement = require('./handleMovement');

/**
 * @description Abstract case class for all forcefield types. Don't create an
 * instance of this class.
 * @extends Component
 */
class Forcefield extends Component {
  /**
   * @private This is an internal function.
   * @description Creates a new forcefield.
   * @param {ForcefieldCallback} callback - The function calculating the force
   * applied inside the forcefield. Parameters are the current and previous
   * god object positions.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0.
   */
  constructor(callback, handles) {
    super(handles || 0);
    this.callback = callback;
    this.forced = {};
  }

  /**
   * @private This is an internal function.
   * @description Update the component with one handle's movement. Uses the
   * contains funtion defined by subclasses to check if the god object is
   * inside the forcefield. If yes, the force is calculated using the callback
   * specified during construction and applied to the handle.
   * @param {HandleMovement} handleMovement - The handle's
   * movement.
   */
  updatePosition(handleMovement) {
    const index = handleMovement.index;
    if (this.contains(handleMovement.newGodObjectPosition)) {
      const force = this.callback(
          handleMovement.newGodObjectPosition,
          handleMovement.oldGodObjectPosition);
      this.forced[index] = true;
      if (force.length() > 0) {
        this.hapticObject.device.applyForceTo(index, force);
      }
    } else if (this.forced[index]) {
      this.hapticObject.device.unblock(index);
      this.forced[index] = false;
    }
  }
}

module.exports = Forcefield;
