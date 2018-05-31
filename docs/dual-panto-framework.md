# DualPanto Framework

This contains the API documentation of the main framework.<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [DualPantoFramework][1]
-   [Broker][2]
    -   [run_script][3]
    -   [waitMS][4]
    -   [getDevices][5]
-   [Device][6]
    -   [moveHandleTo][7]
    -   [applyForceTo][8]
    -   [movePantoTo][9]
    -   [unblockHandle][10]
-   [VoiceInteraction][11]
    -   [speakText][12]
    -   [setCommands][13]
    -   [beginListening][14]
    -   [haltListening][15]

## DualPantoFramework

The shared broker.

Type: [Broker][16]

**Parameters**

-   `voiceInteraction` **[VoiceInteraction][17]** shared voice interaction instance

**Examples**

```javascript
const DualPantoFramework = require('dualpantoframework');
const VoiceInteraction = DualPantoFramework.voiceInteraction;
```

## Broker

**Extends EventEmitter**

Class for device handling and basic functions

**Properties**

-   `devices` **[Map][18]&lt;[string][19], [Device][20]>** map of connected devices
-   `disconnectTimeout` **[number][21]** timeout after which a device gets disconnected

### run_script

Creates a script that executes a list of promises.

**Parameters**

-   `promise_list` **[array][22]** the list of promises to execute.

**Examples**

```javascript
// OLD: run_script syntax:
device.on('handleMoved', (index, position) => {
    run_script([
        () => device.movePantoTo(0, new Vector(1, 2, 0)),
        () => DualPantoFramework.waitMS(500),
        () => device.movePantoTo(1, new Vector(4, 5, 0)),
    ]);
});
// NEW: async / await syntax:
device.on('handleMoved', async (index, position) => {
    await device.movePantoTo(0, new Vector(1, 2, 0));
    await DualPantoFramework.waitMS(500);
    await device.movePantoTo(1, new Vector(4, 5, 0));
});
```

**Meta**

-   **deprecated**: **use async / await instead**


### waitMS

Generates a promise that creates a timeout.

**Parameters**

-   `ms` **[number][21]** number ob ms to wait.

**Examples**

```javascript
await DualPantoFramework.waitMS(500);
```

Returns **[Promise][23]** The promise executing the timeout.

### getDevices

Returns all connected devices.

**Examples**

```javascript
for(const device of DualPantoFramework.getDevices()) {
    console.log(device);
}
```

Returns **[Set][24]** The connected devices.

## Device

**Extends EventEmitter**

Class for panto interaction.

**Parameters**

-   `port` **[string][19]** port on that the device is connected.

### moveHandleTo

moves a Handle to a position

**Parameters**

-   `index` **[number][21]** index of handle to move
-   `target` **[Vector][25]** position the handle should be moved to

**Examples**

```javascript
device.moveHandleTo(0, new Vector(35, -50, 0));
```

### applyForceTo

applies force vector to the pantograph

**Parameters**

-   `index` **[number][21]** index of handle to apply force
-   `force` **[Vector][25]** vector of force to render. 3rd element will be ignored.

**Examples**

```javascript
device.applyForceTo(0, new Vector(5, 7));
```

### movePantoTo

Returns a promise that invokes handle movement with tween behaviour

**Parameters**

-   `index` **[number][21]** index of handle to move
-   `target` **[Vector][25]** position the handle should be moved to
-   `duration` **[number][21]** time in ms that the movement shall take. (optional, default `500`)
-   `interpolationMethod` **[Object][26]** tween function that is used to generate the movement. (optional, default `TWEEN.Easing.Quadratic.Out`)

**Examples**

```javascript
await device.movePantoTo(1, new Vector(24, -38, Math.PI/2));

// slow moevement (1 second = 1000 milliseconds)
await device.movePantoTo(1, new Vector(24, -38, Math.PI/2), 1000);
```

Returns **[promise][23]** the promise executing the movement

### unblockHandle

Returns a promise that unblocks a handle

**Parameters**

-   `index` **[number][21]** index of handle to unblock

**Examples**

```javascript
await device.unblockHandle();
```

Returns **[Promise][23]** the promise executing the unblock

## VoiceInteraction

**Extends EventEmitter**

Class for voice input and output

### speakText

Speaks a text.

**Parameters**

-   `txt` **[string][19]** The text to speak.
-   `language` **[string][19]** The language to speak. (optional, default `DE`)
-   `speed` **[number][21]** The speed that is spoken with. (optional, default `1.4`)

**Examples**

```javascript
await VoiceInteraction.speakText('Hallo Welt!');
await VoiceInteraction.speakText('Hello World', 'EN', 1.3);
```

Returns **[undefined][27]** Currenlty nothing is returned

### setCommands

Sets up the voice input listener.

**Parameters**

-   `commands` **[array][22]** List of Strings to listen for.

**Examples**

```javascript
VoiceInteraction.setCommands(['Hotels']);
```

### beginListening

starts the listener.

**Examples**

```javascript
await VoiceInteraction.beginListening();
```

Returns **[Promise][23]** An already resolved promise

### haltListening

stops the listener.

**Examples**

```javascript
await VoiceInteraction.haltListening();
```

Returns **[Promise][23]** An already resolved promise

[1]: #dualpantoframework

[2]: #broker

[3]: #run_script

[4]: #waitms

[5]: #getdevices

[6]: #device

[7]: #movehandleto

[8]: #applyforceto

[9]: #movepantoto

[10]: #unblockhandle

[11]: #voiceinteraction

[12]: #speaktext

[13]: #setcommands

[14]: #beginlistening

[15]: #haltlistening

[16]: #broker

[17]: #voiceinteraction

[18]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map

[19]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[20]: #device

[21]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[22]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[23]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise

[24]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set

[25]: geometry.md#vector

[26]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[27]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined