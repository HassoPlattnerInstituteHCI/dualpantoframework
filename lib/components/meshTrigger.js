'use strict';

const Trigger = require('./trigger');
const Mesh = require('./mesh');

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
   * @param {Mesh} mesh - The mesh which the trigger should be
   * based on.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0 (default defined in Trigger).
   */
  constructor(mesh, handles) {
    super(handles);
    this.traceableObject = mesh;
  }
}

module.exports = MeshTrigger;
