'use strict';

const Trigger = require('./trigger');

/**
 * @description Trigger based on an custom mesh. May either be used with or
 * without a mesh collider. If used with a collider, startTouch/touch/endTouch
 * events are emitted, otherwise enter/inside/leave events are emitted.
 * @emits enter - The handle moved into the trigger zone.
 * @emits inside - The handle is inside the trigger zone.
 * @emits leave - The handle left the trigger zone.
 * @emits startTouch - The handle started touching the collider.
 * @emits touch - The handle is touching the collider.
 * @emits endTouch - The handle stopped touching the collider.
 * @extends Trigger
 */
class MeshTrigger extends Trigger {
  /**
   * @description Creates a new MeshTrigger with the given mesh.
   * @param {import('./mesh')} mesh - The mesh which the trigger should be
   * based on.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Trigger).
   */
  constructor(mesh, handles) {
    super(handles);
    this.mesh = mesh;
  }

  /**
   * @private This is an internal function.
   * @description Checks if the given point is inside the mesh.
   * @param {import('../vector')} position - Point to check.
   * @return {boolean} True if the point is inside, false otherwise.
   */
  contains(position) {
    return this.mesh.contains(
        position.difference(this.hapticObject.position));
  }
}

module.exports = MeshTrigger;
