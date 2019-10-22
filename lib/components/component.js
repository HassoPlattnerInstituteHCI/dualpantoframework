'use strict';

const EventEmitter = require('events');
const HandleMovement = require('../handleMovement');
const Vector = require('../vector');

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
    this.traceableObject;
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
        if (handleMovements[handleIndex]) {
          this.updatePosition(handleMovements[handleIndex]);
        }
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
   * @private This is an internal function.
   * @description Checks if the given point is inside the traceableObject.
   * @param {Vector} position - Point to check.
   * @return {boolean} True if the point is inside, false otherwise.
   */
  contains(position) {
    return this.traceableObject.contains(
        position.difference(this.hapticObject.position));
  }

  /**
   * @description Traces the shape of the component.
   * @param {number} index - Index of the handle to trace the shape.
   * @return {Promise} The promise that runs the tracing of the shape.
   */
  trace(index = 1) {
    return new Promise((resolve) => {
      if (this.traceableObject) {
        this.traceableObject.trace(index).then(() => resolve(resolve));
      } else {
        console.log('WARNING: No traceableObject found!');
        console.log('Please make sure your component has a traceableObject!');
        resolve(resolve);
      }
    });
  }
}

module.exports = Component;
