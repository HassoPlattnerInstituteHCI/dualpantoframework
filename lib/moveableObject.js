const Vector = require('./../Vector.js'),
      Obstacles = require('./obstacle.js');

class MoveableObject {
  constructor(position = new Vector(0,0,0)){
    this.position = position;
    this.movementDirection = new Vector(0,0,0);
    this.obstacles = [];
    this.processingCollision = false;
  }

  setMovementDirection(direction){
    this.movementDirection = direction;
  }

  move(){
    this.processingCollision = false;
    let targetpoint = this.position.sum(this.movementDirection);
    let collisions = this.checkCollison(targetpoint);
    while(collisions.length > 0){
      this.processingCollision = true;
      const collidingEdge = collisions[0].getCollisionEdge(targetpoint, this.position);
      let outsidepoint = collisions[0].getClosestOutsidePoint(collidingEdge, targetpoint);
      this.movementDirection = outsidepoint.difference(this.position);
      targetpoint = this.position.sum(this.movementDirection);
      collisions = this.checkCollison(targetpoint);
    }
    this.position = targetpoint;
  }

  checkCollison(point){
    let collisions = [];
    for(let i = 0; i < this.obstacles.length; i++){
      const information = this.obstacles[i].inside(point);
      if(information[0]){
        collisions.push(information[1]);
      }
    }
    return collisions;
  }

  addObstacle(pointArray){
    this.obstacles.push(new Obstacles(pointArray));
  }

  removeObstacle(pointArray){
    const index = this.obstacles.indexOf(pointArray);
    this.obstacles.splice(index, 1);
  }
}
module.exports = MoveableObject;