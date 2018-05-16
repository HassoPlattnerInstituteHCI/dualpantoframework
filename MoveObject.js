const Vector = require('./Vector.js');

class MoveObject {
  constructor(position=new Vector(0,0,0)){
    this.position = position;
    this.movementByForce = new Vector(0,0,0);
    this.handelsCollision = false;
  }

  setMovementForce(force){
    this.movementByForce = force;
  }

  applyforce(force){
    this.movementByForce = this.movementByForce.add(force);
  }

  move(){
    this.position = this.position.add(this.movementByForce);
  }
}
module.exports = MoveObject;
