/* eslint-disable require-jsdoc */
const Component = require('./component');

nextObstacleId = 0;
usedObstacleIds = new Set();

class Collider extends Component {
  constructor(handles) {
    super(handles || 0);
  }
  static generateId() {
    while (usedObstacleIds.has(nextObstacleId)) {
      nextObstacleId = (nextObstacleId + 1) % 0xFFFF;
    }
    const id = nextObstacleId;
    nextObstacleId = (nextObstacleId + 1) % 0xFFFF;
    usedObstacleIds.add(id);
    return id;
  }
}

module.exports = Collider;
