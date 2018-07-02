const Vector = require('./vector');
const Collider = require('./collider');

class Obstacle extends Collider {
  constructor(pointArray){
    super(pointArray);
    this.id = this.generateGUID();
  }

  handleCollison(targetpoint, position){
    const collidingEdge = this.getEnteringEdge(targetpoint, position);
    let outsidepoint = this.getClosestOutsidePoint(collidingEdge, targetpoint);
    let movementDirection = outsidepoint.difference(position);
    targetpoint = position.sum(movementDirection);
    return targetpoint;
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
}
module.exports = Obstacle;
