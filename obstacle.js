const Vector = require('./Vector.js');
      math = require('mathjs');
class Obstacle {
  constructor(pointArray){
    this.pointArray = pointArray
  }

  inside(point) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    let x = point.x, y = point.y;
    let once = true;

    let inside = false;
    for (let i = 0, j = this.pointArray.length - 1; i < this.pointArray.length; j = i++) {
        let xi = this.pointArray[i].x, yi = this.pointArray[i].y;
        let xj = this.pointArray[j].x, yj = this.pointArray[j].y;

        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect){
         inside = !inside;
        }
    }

    return [inside, this];
  }

  findCollisionPoint(point, vector){
    let point1 = [point.x, point.y];
    let vecP2 = point.sum(vector);
    let point2 = [vecP2.x, vecP2.y];
    let x = 0;
    for (let i = 0, j = this.pointArray.length - 1; i < this.pointArray.length; j = i++) {
      let xi = this.pointArray[i].x, yi = this.pointArray[i].y;
      let xj = this.pointArray[j].x, yj = this.pointArray[j].y;
      let temp = math.intersect([xi, yi], [xj, yj], point1, point2);
      if(!(temp[0] == 0 && temp[1] == 0)){
        let z = (temp[0] - point.x)/vector.x;
        if(x = 0 || z < x){
          x = z;
        }
      }
    }
    let collisionPoint = point.sum(vector.scale(x));
    return collisionPoint;
  }
}
module.exports = Obstacle;
