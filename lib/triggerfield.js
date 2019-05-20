/* eslint-disable require-jsdoc */
const EventEmitter = require('events').EventEmitter;

class Triggerfield extends EventEmitter {
  constructor(pointArray, obsID) {
    super();
    this.pointArray = pointArray;
    this.id = this.generateGUID();
    this.obsID = obsID;
    this.isInside = false;
  }

  generateGUID() {
    let guid = '';
    for (let i = 0; i < 32; i++) {
      const random = Math.random() * 16 | 0;

      if (i == 8 || i == 12 || i == 16 || i == 20) {
        guid += '-';
      }
      guid += (i == 12 ? 4 : (i == 16 ?
        (random & 3 | 8) :
        random)).toString(16);
    }
    return guid;
  }

  inside(point) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    const x = point.x; const y = point.y;
    let inside = false;
    for (let i = 0, j = this.pointArray.length - 1;
      i < this.pointArray.length; j = i++) {
      const xi = this.pointArray[i].x; const yi = this.pointArray[i].y;
      const xj = this.pointArray[j].x; const yj = this.pointArray[j].y;
      const intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) {
        inside = !inside;
      }
    }
    if (inside && !this.isInside) {
      this.emit('disable!', this.obsID);
    }
    if (inside) {
      this.isInside = true;
    } else {
      this.isInside = false;
    }
  }
}
module.exports = Triggerfield;
