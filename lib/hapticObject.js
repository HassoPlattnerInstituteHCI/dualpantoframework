/* eslint-disable require-jsdoc */
const Component = require('./components/component');

class HapticObject {
  constructor(position) {
    this.components = [];
    this.position = position;
  }

  addComponent(component) {
    if (component instanceof Component) {
      this.components.push(component);
      component.hapticObject = this;
    }
    return component;
  }

  updatePositions(handleMovements) {
    // console.log('ho up');
    for (const component of this.components) {
      component.updatePositions(handleMovements);
    }
  }
}

module.exports = HapticObject;
