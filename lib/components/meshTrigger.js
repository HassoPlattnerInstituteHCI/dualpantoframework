/* eslint-disable require-jsdoc */
const Trigger = require('./trigger');

class MeshTrigger extends Trigger {
  constructor(mesh, handles) {
    super(handles);
    this.mesh = mesh;
  }

  contains(position) {
    return this.mesh.contains(
        position.difference(this.hapticObject.position));
  }
}

module.exports = MeshTrigger;
