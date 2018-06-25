const Vector = require('./vector');
const Collider = require('./collider');

class Forcefield extends Collider {
  constructor(pointArray, handleFunction){
    super(pointArray);
    this.handleCollison = handleFunction;
  }
}
module.exports = Forcefield;
