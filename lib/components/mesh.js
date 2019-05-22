/* eslint-disable require-jsdoc */
const Component = require('./component');

class Mesh extends Component {
  constructor(path, handles) {
    super(handles);
    this.path = path;
  }
}

module.exports = Mesh;
