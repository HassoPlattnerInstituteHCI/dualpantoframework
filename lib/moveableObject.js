const Vector = require('./vector'),
      Obstacles = require('./obstacle');

const bigPantoForceScale = 0.1125;
const smallPantoForceScale = 0.125;

class MoveableObject {
  constructor(position = new Vector(0,0,0)){
    this.position = position;
    this.movementDirection = new Vector(0,0,0);
    this.activeForce = new Vector(0,0,0);
    this.obstacles = [];
    this.forcefields = [];
    this.processingObstacleCollision = false;
    this.doneColliding = false;
  }

  setMovementDirection(direction){
    this.movementDirection = direction;
  }

  move(){
    const laststate = this.processingObstacleCollision
    this.processingObstacleCollision = false;
    const handlePosition = this.position.sum(this.movementDirection);
    let collisions = this.checkObstaclesCollison(handlePosition);
    let targetpoint = handlePosition;
    while(collisions.length > 0){
      this.processingObstacleCollision = true;
      targetpoint = collisions[0][0].handleCollison(targetpoint, this.position);
      collisions = this.checkObstaclesCollison(targetpoint);
    }
    this.position = targetpoint;
    if(this.processingObstacleCollision){
      this.activeForce = this.position.difference(handlePosition).scale(bigPantoForceScale);
    }else{
      collisions = this.checkForcefieldsCollision(handlePosition);
      this.activeForce = new Vector(0, 0, NaN);
      for(let i = 0; i < collisions.length; i++){
        this.processingObstacleCollision = true;
        this.activeForce = this.activeForce.sum(collisions[i].handleCollison(handlePosition).scale(smallPantoForceScale));
      }
    }
    if(laststate && !this.processingObstacleCollision){
      this.doneColliding = true;
    }else{
      this.doneColliding = false;
    }
  }

  checkObstaclesCollison(point){
    let collisions = [];
    for(let i = 0; i < this.obstacles.length; i++){
      const information = this.obstacles[i].inside(point);
      if(information[0]){
        const collidingEdge = information[1].getEnteringEdge(point, this.position);
        if(collidingEdge != null){
          collisions.push([information[1], collidingEdge]);
        }
      }
    }
    return collisions;
  }

  checkForcefieldsCollision(point){
    let collisions = [];
    for(let i = 0; i < this.forcefields.length; i++){
      const information = this.forcefields[i].inside(point);
      if(information[0]){
        collisions.push(information[1]);
      }
    }
    return collisions;
  }

  addObstacle(obstacle){
    this.obstacles.push(obstacle);
  }

  removeObstacle(obstacle){
    const index = this.obstacles.indexOf(obstacle);
    if(index != -1)this.obstacles.splice(index, 1);
  }

  addForcefield(forcefield){
    this.forcefields.push(forcefield);
  }

  removeForcefield(forcefield){
    const index = this.forcefields.indexOf(forcefield);
    if(index != -1)this.forcefields.splice(index, 1);
  }
}
module.exports = MoveableObject;