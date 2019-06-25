'use strict';

const EventEmitter = require('events');
const HandleMovement = require('../handleMovement');

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
    this.enabled = true;
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
    if (!this.enabled || this.updatePosition === undefined) {
      return;
    }
    for (const arrayIndex in this.handles) {
      if (this.handles.hasOwnProperty(arrayIndex)) {
        const handleIndex = this.handles[arrayIndex];
        this.updatePosition(handleMovements[handleIndex]);
      }
    }
  }

  /**
   * @description Enables the component
   */
  enable() {
    this.enabled = true;
  }

  /**
   * @description Disables the component
   */
  disable() {
    this.enabled = false;
  }

  /**
   * @description Traces the shape of the component.
   * @param {number} index - Index of the handle to trace the shape.
   */
  trace(index = 1) {
    if (this.mesh) {
      this.mesh.trace(index);
    } else {
      console.log('WARNING: No mesh found!');
      console.log('Please make sure your component has a mesh or creates' +
                  'its own trace function!');
    }
  }
}

module.exports = Component;
