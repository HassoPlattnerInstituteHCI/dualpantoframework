/* eslint-disable require-jsdoc */
const Component = require('./component');

class Collider extends Component {
  constructor(handles) {
    super(handles || 0);
  }
}

module.exports = Collider;
