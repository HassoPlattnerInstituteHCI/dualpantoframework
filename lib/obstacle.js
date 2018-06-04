const Vector = require('./../Vector.js');

class Obstacle {
  constructor(pointArray){
    this.pointArray = pointArray
  }

  intersect2d(p1a, p1b, p2a, p2b, linintersection = false){
    let lineA = p1b.difference(p1a);
    let lineB = p2b.difference(p2a);
    let determinante = (lineA.x * lineB.y) - (lineB.x * lineA.y);
    if(Math.abs(determinante) < 0.001){
      return null;
    }
    let detBA_0 = lineB.x * p1a.y;
    let detBA_1 = lineB.y * p1a.x;
    let detBB_0 = lineB.x * p2a.y;
    let detBB_1 = lineB.y * p2a.x;
    let t = (((detBA_0 - detBA_1) - detBB_0) + detBB_1) / determinante;
    if((!linintersection) && (t>1 || t<0)){
      return null;
    }
    return p1a.sum(lineA.scale(t));
  }

  inside(point){
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    let x = point.x, y = point.y;
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

  getCollisionEdge(positionHandle, positionObject){
    let smallestDistance = NaN;
    let edge = null;
    for (let i = 0, j = this.pointArray.length - 1; i < this.pointArray.length; j = i++) {
      let pointA = this.pointArray[i];
      let pointB = this.pointArray[j];
      let intersectionPoint = this.intersect2d(positionObject, positionHandle, pointA, pointB);
      if(intersectionPoint == null){
        continue;
      }
      let difference = intersectionPoint.difference(positionObject);
      if(isNaN(smallestDistance) || difference.length() < smallestDistance){
        smallestDistance = difference.length();
        edge = [pointA, pointB];
      }
    }
    return edge;
  }

  getClosestOutsidePoint(edge, positionHandle){
    let lineDirection = edge[0].difference(edge[1]);
    let perpendicular_vector = new Vector(-lineDirection.y, lineDirection.x);
    let outsidePoint = this.intersect2d(edge[0], edge[1], positionHandle, positionHandle.sum(perpendicular_vector), true);
    let collisionVec = outsidePoint.difference(positionHandle);
    outsidePoint = positionHandle.sum(collisionVec.scale(1.1));
    return outsidePoint;
  }

}
module.exports = Obstacle;