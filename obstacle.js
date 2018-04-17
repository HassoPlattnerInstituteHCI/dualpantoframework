class Obstacle {
  constructor(pointArray){
    this.pointArray = pointArray
  }

  inside(point) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = self.pointArray.length - 1; i < self.pointArray.length; j = i++) {
        var xi = self.pointArray[i][0], yi = self.pointArray[i][1];
        var xj = self.pointArray[j][0], yj = self.pointArray[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
  }
}
module.exports = Obstacle;
