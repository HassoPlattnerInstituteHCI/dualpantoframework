'use strict';

const Component = require('./component');
const Vector = require('../vector');

/**
 * @description A tracableObject that every component has.
 * @extends Component
 */
class TraceableObject extends Component {
  /**
   * @description Creates a new TracableObject.
   * @param {number|number[]} [handles=[]] - The handle or handles which this
   * component should apply to. Defaults to neither (default defined
   * in Component). It is recommended to leave this value set to neither,
   * as the object itself doesn't have any behaviour anyway.
   */
  constructor(handles) {
    super(handles);
  }

  /**
   * @private This is an internal function.
   * @description Checks if the given point is inside the objecth.
   * @param {Vector} position - Point to check.
   * @return {boolean} True if the point is inside, false otherwise.
   */
  contains(position) {
    console.log('no contain function given');
    return false;
  }

  /**
   * @description Traces the shape of the object.
   * @param {number} index - Index of the handle to trace the shape.
   * @return {Promise} The promise that runs the trace script.
   */
  trace(index = 1) {
    return new Promise((resolve) => {
      console.log('no implementation of trace found!');
      resolve(resolve);
    });
  }
}

module.exports = TraceableObject;
