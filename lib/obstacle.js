const Vector = require('./vector');
const Collider = require('./collider');

class Obstacle extends Collider {
  constructor(pointArray){
    super(pointArray);
  }

  handleCollison(targetpoint, position){
    const collidingEdge = this.getEnteringEdge(targetpoint, position);
    let outsidepoint = this.getClosestOutsidePoint(collidingEdge, targetpoint);
    let movementDirection = outsidepoint.difference(position);
    targetpoint = position.sum(movementDirection);
    return targetpoint;
  }
}
module.exports = Obstacle;
