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

  findCollisionEdge(point, vector){
    let point1 = this.vectorToMathPoint(point);
    let vecP2 = point.sum(vector);
    let point2 = this.vectorToMathPoint(vecP2);
    let x = 0;
    let edge = [[0,0],[0,0]];
    for (let i = 0, j = this.pointArray.length - 1; i < this.pointArray.length; j = i++) {
      let xi = this.pointArray[i].x, yi = this.pointArray[i].y;
      let xj = this.pointArray[j].x, yj = this.pointArray[j].y;
      let pointi = [xi, yi];
      let pointj = [xj, yj];
      let temp = math.intersect(pointi, pointj, point1, point2);
      if(!(temp[0] == 0 && temp[1] == 0)){
        let z = (temp[0] - point.x)/vector.x;
        if(x == 0 || Math.abs(z) < Math.abs(x)){
          x = z;
          edge[0] = pointi;
          edge[1] = pointj;
        }
      }
    }
    return edge;
  }

  getNextOutsidePoint(edge_points, position_vector){
    let edge_point1 = edge_points[0];
    let edge_point2 = edge_points[1];
    let perpendicular_vector = new Vector(edge_point2[1] - edge_point1[1], - (edge_point2[0]- edge_point1[0]), NaN);
    let perpendicular_point_vector = position_vector.sum(perpendicular_vector);
    let outside_point = math.intersect(edge_point1, 
                                       edge_point2,
                                       this.vectorToMathPoint(position_vector), 
                                       this.vectorToMathPoint(perpendicular_point_vector));
    if(outside_point[0] == 0 && outside_point[1] == 0){
      perpendicular_point_vector = position_vector.difference(perpendicular_vector);
      outside_point = math.intersect(edge_point1, 
                                     edge_point2,
                                     this.vectorToMathPoint(position_vector), 
                                     this.vectorToMathPoint(perpendicular_point_vector));
    }
    return this.mathPointToVector(outside_point);
  }

  vectorToMathPoint(vector){
    return [vector.x, vector.y];
  }

  mathPointToVector(point){
    return new Vector(point[0], point[1], NaN);
  }
}
module.exports = Obstacle;
