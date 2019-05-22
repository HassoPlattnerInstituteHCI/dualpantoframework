/* eslint-disable require-jsdoc */
const EventEmitter = require('events');

class Component extends EventEmitter {
  constructor(handles) {
    super();
    console.log(handles);
    if (typeof handles === 'undefined') {
      this.handles = [];
    } else if (Array.isArray(handles)) {
      this.handles = handles;
    } else {
      this.handles = [handles];
    }
  }

  updatePositions(handleMovements) {
    // console.log('comp up');
    // console.log(this.handles);
    for (const arrayIndex in this.handles) {
      if (this.handles.hasOwnProperty(arrayIndex)) {
        // console.log(arrayIndex);
        const handleIndex = this.handles[arrayIndex];
        this.updatePosition(handleMovements[handleIndex]);
      }
    }
  }
}

module.exports = Component;
