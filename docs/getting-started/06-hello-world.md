# [Getting Started](README.md) - Step 6
## Hello World

To use the dual panto framework your have to import (in javascript it is called `require`) the `dualpantoframework`:
```js
`use strict`;

const {Broker, Vector} = require('dualpantoframework');
```

The broker is the class, that manages the devices and tells you once a device is connected. Therefore create your broker instance and listen for new devices:
```js
const broker = new Broker();

broker.on('device', async device => {
    // use the device :D
});
```

Lets say hello to the user and let the it handle follow the me handle:
```js
broker.on('device', async device => {
    await device.speakText('Hello');

    device.meHandle.on('positionChanged', position => {
        // 0 = no animation, move there directly
        device.itHandle.moveTo(position, 0);
    });
});
```

### The complete file
```js
`use strict`;

const {Broker, Vector} = require('dualpantoframework');

const broker = new Broker();

broker.on('device', async device => {
    await device.speakText('Hello');

    device.meHandle.on('positionChanged', position => {
        // 0 = no animation, move there directly
        device.itHandle.moveTo(position, 0);
    });
});
```

Next: [Step 7 - Async and await](07-async-await.md)
