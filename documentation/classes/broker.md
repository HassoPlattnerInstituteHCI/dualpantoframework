<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

## Broker

**Extends EventEmitter**

Class for device handling and basic functions.

### runScript

Creates a script that executes a list of promises.

#### Parameters

-   `promiseList` **[Array][1]** Array of functions which return promises.

### waitMS

Generates a promise that creates a timeout.

#### Parameters

-   `ms` **[number][2]** Number ob ms to wait.

Returns **[Promise][3]** The promise executing the timeout.

### getDevices

Returns all connected devices.

Returns **[Set][4]&lt;[Device](device.md)>** The connected devices.

### getDeviceByPort

Returns the device connected to a specific port.

#### Parameters

-   `port` **[string][5]** The port of the device.

Returns **[Device](device.md)** The connected device.

### createVirtualDevice

Creates a new virtual device.

Returns **[Device](device.md)** The new virtual device.

[1]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[2]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[3]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise

[4]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set

[5]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String