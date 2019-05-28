'use strict';

const Component = require('./components/component');

/**
 * @typedef {import('./vector')} Vector
 * @typedef {import('./handleMovement')} HandleMovement
 */

/**
 * @description Represents any type of haptically discoverable object.
 * Exact behaviour is specified by adding components.
 */
class HapticObject {
  /**
   * @description Creates a HapticObject at the given position.
   * @param {Vector} position - The object's position.
   * This is used as origin for all child components.
   */
  constructor(position) {
    this.components = [];
    this.position = position;
  }

  /**
   * @description Adds a component to the HapticObject.
   * This also sets this HapticObject as the component's HapticObject.
   * @param {Component} component - The component to be added.
   * @return {Component} The added component.
   */
  addComponent(component) {
    if (component instanceof Component) {
      this.components.push(component);
      component.hapticObject = this;
      if ('init' in component) {
        component.init();
      }
    }
    return component;
  }

  /**
   * @description Updates the child components with the handles' movements.
   * @private
   * @param {HandleMovement[]} handleMovements - The handles' movements.
   */
  updatePositions(handleMovements) {
    for (const component of this.components) {
      component.updatePositions(handleMovements);
    }
  }
}

module.exports = HapticObject;
