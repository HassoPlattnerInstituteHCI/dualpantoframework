'use strict';

const EventEmitter = require('events');
const HandleMovement = require('./handleMovement');

/**
 * @description Abstract base class for all HapticObject components.
 * @extends EventEmitter
 */
class Component extends EventEmitter {
  /**
   * @private This is an internal function.
   * @description Creates a new component.
   * @param {number|number[]} [handles=[]] - The handle or handles which this
   * component should apply to. Defaults to neither.
   */
  constructor(handles) {
    super();
    if (typeof handles === 'undefined') {
      this.handles = [];
    } else if (Array.isArray(handles)) {
      this.handles = handles;
    } else {
      this.handles = [handles];
    }
  }

  /**
   * @private This is an internal function.
   * @description Update the component with the handles' movements and invoke
   * component-specific behaiour.
   * @param {HandleMovement[]} handleMovements - The handles'
   * movements.
   */
  updatePositions(handleMovements) {
    // some components might not care about position updates
    if (this.updatePosition === undefined) {
      return;
    }
    for (const arrayIndex in this.handles) {
      if (this.handles.hasOwnProperty(arrayIndex)) {
        const handleIndex = this.handles[arrayIndex];
        this.updatePosition(handleMovements[handleIndex]);
      }
    }
  }
}

module.exports = Component;
