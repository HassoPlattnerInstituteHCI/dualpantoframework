/* eslint-disable require-jsdoc */
const Collider = require('./collider');

class MeshCollider extends Collider {
  constructor(mesh, handles) {
    super(handles);
    this.mesh = mesh;
  }
  init() {
    if (this.handles.length == 0) {
      console.log(
          'Skipping obstacle creation for collider affecting zero handles');
      return;
    }

    const offset = this.hapticObject.position;

    const maxPointsInPacket = 31;
    const pointArrayCopy = this.mesh.path.map((v) => v.sum(offset));
    const id = Collider.generateId();
    const index = this.handles.length == 2 ? -1 : this.handles[0];
    let segment = pointArrayCopy.splice(0, maxPointsInPacket);

    // eslint-disable-next-line require-jsdoc
    function data() {
      return {
        posArray: segment.reduce((posArray, point) => {
          posArray.push(point.x);
          posArray.push(point.y);
          return posArray;
        }, []),
        id: id,
        index: index
      };
    }

    const device = this.hapticObject.device;

    device.send({
      messageType: 0xA0,
      data: data()
    });

    while (pointArrayCopy.length > 0) {
      segment = pointArrayCopy.splice(0, maxPointsInPacket);
      device.send({
        messageType: 0xA1,
        data: data()
      });
    }

    device.send({
      messageType: 0xA3,
      data: {
        id: id,
        index: index
      }
    });
  }
}

module.exports = MeshCollider;
