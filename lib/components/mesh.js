/* eslint-disable require-jsdoc */
const Component = require('./component');

class Mesh extends Component {
  constructor(path, handles) {
    super(handles);
    this.path = path;
  }
  contains(point) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    const x = point.x; const y = point.y;
    let inside = false;
    for (let i = 0, j = this.path.length - 1;
      i < this.path.length; j = i++) {
      const xi = this.path[i].x; const yi = this.path[i].y;
      const xj = this.path[j].x; const yj = this.path[j].y;
      const intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }
}

module.exports = Mesh;
