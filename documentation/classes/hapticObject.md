<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

## HapticObject

Represents any type of haptically discoverable object.
Exact behaviour is specified by adding components.

### Parameters

-   `position` **[Vector](vector.md)** The object's position.
    This is used as origin for all child components.

### addComponent

Adds a component to the HapticObject.
This also sets this HapticObject as the component's HapticObject.

#### Parameters

-   `component` **[Component](components\component.md)** The component to be added.

Returns **[Component](components\component.md)** The added component.