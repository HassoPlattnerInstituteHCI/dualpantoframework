const Vector = require('./vector');

class Obstacle {
  constructor(pointArray){
    this.pointArray = pointArray;
    this.id = this.generateGUID();
  }

  intersect2d(p1a, p1b, p2a, p2b, linintersection = false){
    const lineA = p1b.difference(p1a);
    const lineB = p2b.difference(p2a);
    const determinante = (lineA.x * lineB.y) - (lineB.x * lineA.y);
    if(Math.abs(determinante) < 0.001){
      return null;
    }
    const detBA_0 = lineB.x * p1a.y;
    const detBA_1 = lineB.y * p1a.x;
    const detBB_0 = lineB.x * p2a.y;
    const detBB_1 = lineB.y * p2a.x;
    const t = (((detBA_0 - detBA_1) - detBB_0) + detBB_1) / determinante;
    if((!linintersection) && (t>1 || t<0)){
      return null;
    }
    return p1a.sum(lineA.scale(t));
  }

  inside(point){
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    const x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = this.pointArray.length - 1; i < this.pointArray.length; j = i++) {
        const xi = this.pointArray[i].x, yi = this.pointArray[i].y;
        const xj = this.pointArray[j].x, yj = this.pointArray[j].y;
        const intersect = ((yi > y) != (yj > y))
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
      const pointA = this.pointArray[i];
      const pointB = this.pointArray[j];
      const intersectionPoint = this.intersect2d(positionObject, positionHandle, pointA, pointB);
      if(intersectionPoint == null){
        continue;
      }
      const difference = intersectionPoint.difference(positionObject);
      if(isNaN(smallestDistance) || difference.length() < smallestDistance){
        smallestDistance = difference.length();
        edge = [pointA, pointB];
      }
    }
    return edge;
  }

  getClosestOutsidePoint(edge, positionHandle){
    const lineDirection = edge[0].difference(edge[1]);
    const perpendicular_vector = new Vector(-lineDirection.y, lineDirection.x);
    let outsidePoint = this.intersect2d(edge[0], edge[1], positionHandle, positionHandle.sum(perpendicular_vector), true);
    const collisionVec = outsidePoint.difference(positionHandle);
    outsidePoint = positionHandle.sum(collisionVec.scale(1.1));
    return outsidePoint;
  }

  generateGUID(){
    var guid = "", i, random;
    for (let i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;
  
      if (i == 8 || i == 12 || i == 16 || i == 20) {
        guid += "-"
      }
      guid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return guid;
  }

  move(direction){
    for(let i = 0; i < this.pointArray.length; i++){
      this.pointArray[i].add(direction);
    }
  }

}
module.exports = Obstacle;
