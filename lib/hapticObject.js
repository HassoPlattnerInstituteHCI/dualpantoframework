'use strict';

const Component = require('./components/component');

/**
 * @description Represents any type of haptically discoverable object.
 * Exact behaviour is specified by adding components.
 */
class HapticObject {
  /**
   * @description Creates a HapticObject at the given position.
   * @param {import('./vector')} position - The object's position.
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
   * @description Removes a component from the HapticObject.
   * @param {Component} component - The component to be removed.
   */
  removeComponent(component) {
    const indexOfComponent = this.components.indexOf(component);
    if (indexOfComponent != -1) {
      if ('remove' in component) {
        component.remove();
      }
      this.components.splice(indexOfComponent, 1);
    }
  }

  /**
   * @description Updates the child components with the handles' movements.
   * @private
   * @param {import('./handleMovement')[]} handleMovements - The handles'
   * movements.
   */
  updatePositions(handleMovements) {
    for (const component of this.components) {
      component.updatePositions(handleMovements);
    }
  }
}

module.exports = HapticObject;
