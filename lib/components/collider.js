/* eslint-disable require-jsdoc */
const Component = require('./component');

const possibleObstacleIds = 0xFFFF;
const maxPointsInPacket = 31;
nextObstacleId = 0;
usedObstacleIds = new Set();

class Collider extends Component {
  constructor(handles) {
    super(handles || 0);
  }

  static generateId() {
    while (usedObstacleIds.has(nextObstacleId)) {
      nextObstacleId = (nextObstacleId + 1) % possibleObstacleIds;
    }
    const id = nextObstacleId;
    nextObstacleId = (nextObstacleId + 1) % possibleObstacleIds;
    usedObstacleIds.add(id);
    return id;
  }

  create(index) {
    if (!this.mesh) {
      console.log('Can\'t create a collider without a mesh');
      return;
    }

    const offset = this.hapticObject.position;
    const meshCopy = this.mesh.path.map((v) => v.sum(offset));
    this.id = Collider.generateId();
    this.hapticObject.device.emit('createObstacle', index, this.id, meshCopy);

    let segment = meshCopy.splice(0, maxPointsInPacket);

    // eslint-disable-next-line require-jsdoc
    function data() {
      return segment.reduce((posArray, point) => {
        posArray.push(point.x);
        posArray.push(point.y);
        return posArray;
      }, []);
    }

    this.sendCreate(data(), index);

    while (meshCopy.length > 0) {
      segment = meshCopy.splice(0, maxPointsInPacket);
      this.sendAdd(data(), index);
    }

    this.sendEnable(index);
  }

  remove(index) {
    this.sendRemove(index);
  }

  enable(index) {
    this.sendEnable(index);
  }

  disable(index) {
    this.sendDisable(index);
  }

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
  sendCreate(posArray, index) {
    this.send(0xA0, posArray, index);
  }
  sendAdd(posArray, index) {
    this.send(0xA1, posArray, index);
  }
  sendRemove(index) {
    this.send(0xA2, undefined, index);
  }
  sendEnable(index) {
    this.send(0xA3, undefined, index);
  }
  sendDisable(index) {
    this.send(0xA4, undefined, index);
  }
}

module.exports = Collider;
