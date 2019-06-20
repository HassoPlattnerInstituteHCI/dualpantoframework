'use strict';

const Component = require('./component');

const possibleObstacleIds = 0xFFFF;
const maxPointsInPacket = 31;
let nextObstacleId = 0;
const usedObstacleIds = new Set();

/**
 * @description Abstract case class for all collider types. Don't create an
 * instance of this class.
 * @extends Component
 */
class Collider extends Component {
  /**
   * @private This is an internal function.
   * @description Creates a new collider.
   * @param {number|number[]} [handles=0] - The handle or handles which this
   * component should apply to. Defaults to 0.
   */
  constructor(handles) {
    super(handles || 0);
  }

  /**
   * @private This is an internal function.
   * @description Generates a new obstacle id, which is used for communication
   * with the hardware.
   * @return {number} The generated id.
   */
  static generateId() {
    while (usedObstacleIds.has(nextObstacleId)) {
      nextObstacleId = (nextObstacleId + 1) % possibleObstacleIds;
    }
    const id = nextObstacleId;
    nextObstacleId = (nextObstacleId + 1) % possibleObstacleIds;
    usedObstacleIds.add(id);
    return id;
  }

  /**
   * @private This is an internal function.
   * @description Creates and enables the obstacle on the hardware. Should be
   * called during the respective collider sublass' init. The collider is
   * created for the handles set during creating the collider.
   */
  create() {
    if (!this.mesh) {
      console.log('Can\'t create a collider without a mesh');
      return;
    }

    const handleIndex = this.handles.length === 1 ? this.handles[0] : -1;
    const offset = this.hapticObject.position;
    const meshCopy = this.mesh.path.map((v) => v.sum(offset));
    this.id = Collider.generateId();
    this.hapticObject.device.emit('createObstacle', handleIndex,
        this.id, meshCopy);

    let segment = meshCopy.splice(0, maxPointsInPacket);

    /**
     * @description Grabs the next block of vertices to send.
     * @return {number[]} A flattened array of the coordinates.
     */
    function data() {
      return segment.reduce((posArray, point) => {
        posArray.push(point.x);
        posArray.push(point.y);
        return posArray;
      }, []);
    }

    this.sendCreate(data(), handleIndex);

    while (meshCopy.length > 0) {
      segment = meshCopy.splice(0, maxPointsInPacket);
      this.sendAdd(data(), handleIndex);
    }

    this.sendEnable(handleIndex);
  }

  /**
   * @description Removes the obstacle from the hardware.
   * @param {number} index - The index of the handle from which the obstacle
   * should be removed, with -1 meaning both handles. Defaults to the handle(s)
   * specified during component creation.
   */
  remove(index) {
    this.sendRemove(index);
    usedObstacleIds.delete(this.id);
  }

  /**
   * @description Enables the obstacle on the hardware.
   * @param {number} index - The index of the handle on which the obstacle
   * should be enabled, with -1 meaning both handles. Defaults to the handle(s)
   * specified during component creation.
   */
  enable(index) {
    this.sendEnable(index);
  }

  /**
   * @description Disables the obstacle on the hardware.
   * @param {number} index - The index of the handle on which the obstacle
   * should be disabled, with -1 meaning both handles. Defaults to the handle(s)
   * specified during component creation.
   */
  disable(index) {
    this.sendDisable(index);
  }

  /**
   * @private This is an internal function.
   * @description Sends an obstacle message to the hardware.
   * @param {number} messageType - The type of message.
   * @param {number[]} posArray - The position data to be transferred, if
   * needed for the message type.
   * @param {number} index - The index of the handle affected by this message,
   * with -1 meaning both handles. Defaults to the handle(s) specified during
   * component creation.
   */
  send(
      messageType,
      posArray,
      index = this.handles.length == 2 ? -1 : this.handles[0]) {
    this.hapticObject.device.send({
      messageType: messageType,
      data: {
        posArray: posArray,
        id: this.id,
        index: index
      }
    });
  }

  /**
   * @private This is an internal function.
   * @description Sends a "create obstacle" message to the hardware.
   * @param {number[]} posArray - The position data to be transferred.
   * @param {number} index - The index of the handle affected by this message,
   * with -1 meaning both handles. Defaults to the handle(s) specified during
   * component creation.
   */
  sendCreate(posArray, index) {
    this.send(0xA0, posArray, index);
  }

  /**
   * @private This is an internal function.
   * @description Sends an "add to obstacle" message to the hardware.
   * @param {number[]} posArray - The position data to be transferred.
   * @param {number} index - The index of the handle affected by this message,
   * with -1 meaning both handles. Defaults to the handle(s) specified during
   * component creation.
   */
  sendAdd(posArray, index) {
    this.send(0xA1, posArray, index);
  }

  /**
   * @private This is an internal function.
   * @description Sends a "remove obstacle" message to the hardware.
   * @param {number} index - The index of the handle affected by this message,
   * with -1 meaning both handles. Defaults to the handle(s) specified during
   * component creation.
   */
  sendRemove(index) {
    this.send(0xA2, undefined, index);
  }

  /**
   * @private This is an internal function.
   * @description Sends an "enable obstacle" message to the hardware.
   * @param {number} index - The index of the handle affected by this message,
   * with -1 meaning both handles. Defaults to the handle(s) specified during
   * component creation.
   */
  sendEnable(index) {
    this.send(0xA3, undefined, index);
  }

  /**
   * @private This is an internal function.
   * @description Sends a "disable obstacle" message to the hardware.
   * @param {number} index - The index of the handle affected by this message,
   * with -1 meaning both handles. Defaults to the handle(s) specified during
   * component creation.
   */
  sendDisable(index) {
    this.send(0xA4, undefined, index);
  }
}

module.exports = Collider;
