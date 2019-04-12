<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [Broker][1]
    -   [run_script][2]
    -   [waitMS][3]
    -   [getDevices][4]
    -   [getDeviceByPort][5]
    -   [createVirtualDevice][6]
-   [VoiceInteraction][7]
    -   [speakText][8]
    -   [sayText][9]
    -   [playSound][10]
    -   [setCommands][11]
    -   [beginListening][12]
    -   [haltListening][13]
-   [Player][14]
    -   [then][15]
    -   [play][16]
    -   [pause][17]
    -   [stop][18]
-   [Device][19]
    -   [disconnect][20]
    -   [poll][21]
    -   [getMePosition][22]
    -   [getItPosition][23]
    -   [send][24]
    -   [handleMoved][25]
    -   [createObstacle][26]
    -   [removeObstacle][27]
    -   [moveHandleTo][28]
    -   [applyForceTo][29]
    -   [movePantoTo][30]
    -   [unblockHandle][31]
    -   [unblock][32]
    -   [tweenPantoTo][33]
    -   [step][34]
-   [Vector][35]
    -   [dot][36]
    -   [scale][37]
    -   [scaled][38]
    -   [add][39]
    -   [sum][40]
    -   [subtract][41]
    -   [difference][42]
    -   [length][43]
    -   [polarAngle][44]
    -   [normalized][45]
    -   [product][46]

## Broker

**Extends EventEmitter**

Class for device handling and basic functions

### run_script

Creates a script that executes a list of promises.

**Parameters**

-   `promise_list` **[array][47]** the list of promises to execute.

### waitMS

Generates a promise that creates a timeout.

**Parameters**

-   `ms` **[number][48]** number ob ms to wait.

Returns **[Promise][49]** The promise executing the timeout.

### getDevices

Returns all connected devices.

Returns **[Set][50]** The connected devices.

### getDeviceByPort

Returns the device connected to a specific port

**Parameters**

-   `port` **[String][51]** the port of the device

Returns **[Device][52]** The connected device.

### createVirtualDevice

Creates a new virtual device

Returns **[Device][52]** The new virtual device.

## VoiceInteraction

**Extends EventEmitter**

Class for voice input and output

### speakText

Speaks a text.

**Parameters**

-   `txt` **[String][51]** The text to speak.
-   `language` **[String][51]** The language to speak. (optional, default `DE`)
-   `speed` **[number][48]** The speed that is spoken with. (optional, default `1.4`)

### sayText

Creates a script which speaks a german text with 1.4 speed.

**Parameters**

-   `txt` **[String][51]** The text to speak.

### playSound

Play a soundfile.

**Parameters**

-   `filename` **[String][51]** The file to play.

Returns **[Player][53]** The player playing the sound

### setCommands

Sets up the voice input listener.

**Parameters**

-   `commands` **[array][47]** List of Strings to listen for.

### beginListening

starts the listener.

### haltListening

stops the listener.

## Player

Player is a class to control the playing of a file

**Parameters**

-   `filename` **[string][51]** The filename of the soundfile.

**Properties**

-   `isPlaying` **[boolean][54]** is the player currently playing

### then

The Player object is awaitable.
The then function is used internely by await or by the old `.then` syntax.

**Parameters**

-   `args` **...any** 

**Examples**

```javascript
await new Player('test.mp3');
// old syntax:
new Player('test.mp3').then(() => console.log('done'));
```

Returns **[Promise][49]** The promise of the state after the callbacks in then.

### play

Continue playing.

### pause

Pause playing.

### stop

Stop playing.

## Device

**Extends EventEmitter**

Class for panto interaction.

**Parameters**

-   `port` **[String][51]** port on that the device is connected.

### disconnect

Disconnect the device.

### poll

Pulls new data from serial connection and handles them.

### getMePosition

gets the last known position of the me handle

Returns **[Vector][55]** last known position as vector

### getItPosition

gets the last known position of the it handle

Returns **[Vector][55]** last known position as vector

### send

Enqueues a packet to be send via the serial connection to the panto.

**Parameters**

-   `index` **[number][48]** index of handle to send to
-   `packet` **[Buffer][56]** containing the payload data

### handleMoved

sets new positions if handles are moved by ViDeb

**Parameters**

-   `index` **[number][48]** index of moved handle
-   `position` **[Vector][55]** position the handle was moved to

### createObstacle

Creates obstacles for handles

**Parameters**

-   `pointArray` **[array][47]** array containing edge points of the obstacle
-   `index` **[number][48]** index of affected handle with -1 meaning both (optional, default `-1`)

Returns **Obstacle** the created obstacle

### removeObstacle

Remove obstacles for handles

**Parameters**

-   `obstacle`  
-   `index` **[number][48]** index of affected handle with -1 meaning both (optional, default `-1`)
-   `pointArray` **[array][47]** array containing edge points of the obstacle

### moveHandleTo

moves a Handle to a position

**Parameters**

-   `index` **[number][48]** index of handle to move
-   `target` **[Vector][55]** position the handle should be moved to

### applyForceTo

applies force vector to the pantograph

**Parameters**

-   `index` **[number][48]** index of handle to apply force
-   `force`  
-   `target` **[Vector][55]** vector of force to render. 3rd element will be ignored.

### movePantoTo

Returns a promise that invokes handle movement with tween behaviour

**Parameters**

-   `index` **[number][48]** index of handle to move
-   `target` **[Vector][55]** position the handle should be moved to
-   `duration` **[number][48]** time in ms that the movement shall take. (optional, default `500`)
-   `interpolation_method` **[Object][57]** tween function that is used to generate the movement. (optional, default `TWEEN.Easing.Quadratic.Out`)

Returns **[promise][49]** the promise executing the movement

### unblockHandle

Returns a promise that unblocks a handle

**Parameters**

-   `index` **[number][48]** index of handle to unblock

Returns **[promise][49]** the promise executing the unblock

### unblock

Unblocks a handle

**Parameters**

-   `index` **[number][48]** index of handle to unblock

### tweenPantoTo

Moves a handle with tween movement behaviour

**Parameters**

-   `index` **[number][48]** index of handle to move
-   `target` **[Vector][55]** position the handle should be moved to
-   `duration` **[number][48]** time in ms that the movement shall take. (optional, default `500`)
-   `interpolation_method` **[Object][57]** tween function that is used to generate the movement. (optional, default `TWEEN.Easing.Quadratic.Out`)

### step

Represents the timesteps for moving objects

## Vector

Class for Class for defining Panto Vecotrs with x, y cords and r as roation

**Parameters**

-   `x` **[number][48]** x coordinate (optional, default `0`)
-   `y` **[number][48]** y coordinate (optional, default `0`)
-   `r` **[number][48]** rotation in radian

### dot

Calculates and returns the dot product with another vector.

**Parameters**

-   `vector` **[Vector][55]** vector to operate with

Returns **[number][48]** The calculated result

### scale

Scales this Vector with a factor.

**Parameters**

-   `factor` **[number][48]** factor to scale vector

Returns **[Vector][55]** The scaled Vector

### scaled

Creates a scaled vector.

**Parameters**

-   `factor` **[number][48]** factor to scale vector

Returns **[Vector][55]** The new scaled Vector

### add

Adds a vector to this vector.

**Parameters**

-   `vector` **[Vector][55]** vector to operate with

Returns **[Vector][55]** The summed up vector

### sum

Returns the sum of this vector and another vector.

**Parameters**

-   `vector` **[Vector][55]** vector to operate with

Returns **[Vector][55]** The new summed up vector

### subtract

Subtracts a vector from this vector.

**Parameters**

-   `vector` **[Vector][55]** vector to operate with

Returns **[Vector][55]** The reduced vector

### difference

Returns the difference of this vector and another vector.

**Parameters**

-   `vector` **[Vector][55]** vector to operate with

Returns **[Vector][55]** The difference vector

### length

Calculates the length of the vector

Returns **[number][48]** length of vector

### polarAngle

Calculates the polar angle of the vector
Right-hand coordinate system:
Positive rotation => Counter Clock Wise
Positive X-Axis is 0

Returns **[number][48]** polar angle of vector

### normalized

Normalizes the vector

Returns **[Vector][55]** this normalized vector

### product

Creates a transformed vector by multiplication with a matrix

**Parameters**

-   `matrix` **[Array][47]** matrix to operate with

Returns **[Vector][55]** The transfromed vector

[1]: #broker

[2]: #run_script

[3]: #waitms

[4]: #getdevices

[5]: #getdevicebyport

[6]: #createvirtualdevice

[7]: #voiceinteraction

[8]: #speaktext

[9]: #saytext

[10]: #playsound

[11]: #setcommands

[12]: #beginlistening

[13]: #haltlistening

[14]: #player

[15]: #then

[16]: #play

[17]: #pause

[18]: #stop

[19]: #device

[20]: #disconnect

[21]: #poll

[22]: #getmeposition

[23]: #getitposition

[24]: #send

[25]: #handlemoved

[26]: #createobstacle

[27]: #removeobstacle

[28]: #movehandleto

[29]: #applyforceto

[30]: #movepantoto

[31]: #unblockhandle

[32]: #unblock

[33]: #tweenpantoto

[34]: #step

[35]: #vector

[36]: #dot

[37]: #scale

[38]: #scaled

[39]: #add

[40]: #sum

[41]: #subtract

[42]: #difference

[43]: #length

[44]: #polarangle

[45]: #normalized

[46]: #product

[47]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[48]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[49]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise

[50]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set

[51]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[52]: #device

[53]: #player

[54]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[55]: #vector

[56]: https://nodejs.org/api/buffer.html

[57]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object