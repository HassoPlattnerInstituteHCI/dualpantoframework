'use strict';

const serial = require('../build/Release/serial');
const Vector = require('./vector');
const HapticObject = require('./hapticObject');
const HandleMovement = require('./handleMovement');
const EventEmitter = require('events').EventEmitter;
const TWEEN = require('@tweenjs/tween.js');
const PositionListener = require('./positionListener');
const TWEEN_INTERVAL = 30;

let tweenStackCounter = 0;
/**
 * @description Class for panto interaction.
 * @extends EventEmitter
 */
class Device extends EventEmitter {
  /**
   * @description Creates a new device.
   * @param {string} port - Port on that the device is connected.
   */
  constructor(port) {
    super();
    if (port == 'virtual') {
      let index = 0;
      port = 'virtual0';
      while (broker.devices.has(port)) port = 'virtual' + index++;
    } else {
      if (process.platform == 'darwin') {
        // macOS
        port = port.replace('/tty.', '/cu.');
      } else if (process.platform == 'win32') {
        // windows
        port = '//.//' + port;
      }
      if (broker.devices.has(port)) return broker.devices.get(port);
      this.serial = true;
    }
    this.port = port;
    this.sendQueue = [];
    this.lastKnownPositions = [];
    this.lastKnownGodObjectPositions = [];
    this.lastTargetPositions = [];
    this.lastReceiveTime = process.hrtime();
    broker.devices.set(this.port, this);
    try {
      if (this.serial) this.serial = serial.open(this.port);
    } catch (err) {
      console.log(err);
    }
    this.hapticObjects = [];
  }

  /**
   * @description Disconnect the device.
   */
  disconnect() {
    if (this.serial) serial.close(this.serial);
    broker.devices.delete(this.port);
  }

  /**
   * @description Pulls new data from serial connection and handles it.
   */
  poll() {
    if (!this.serial) return;
    const time = process.hrtime();
    if (time[0] > this.lastReceiveTime[0] + broker.disconnectTimeout) {
      console.log('Disconnecting due to inactivity');
      this.disconnect();
      return;
    }

    serial.poll(
        this.serial,
        this,
        Vector,
        this.syncCallback,
        this.heartbeatCallback,
        this.positionCallback,
        this.debugLogCallback);

    this.lastReceiveTime = time;

    if (this.serial && this.sendQueue.length > 0) {
      for (const message of this.sendQueue) {
        serial.send(this.serial, message.messageType, message.data);
      }
    }
    this.sendQueue.length = 0;
  }

  /**
   * @description Replies to sync messages with an acknowledgement message.
   */
  syncCallback() {
    this.send({
      messageType: 0x80
    });
    this.lastReceiveTime = process.hrtime();
  }

  /**
   * @description Replies to heartbeat messages with an acknowledgement message.
   */
  heartbeatCallback() {
    this.send({
      messageType: 0x81
    });
    this.lastReceiveTime = process.hrtime();
  }

  /**
   * @description Handles position sent from the panto.
   * @param {Vector[]} positions - The positions sent by the panto.
   */
  positionCallback(positions) {
    const handleMovements = [];
    for (let i = 0; i < 2; ++i) {
      handleMovements.push(
          new HandleMovement(
              i,
              this.lastKnownPositions[i],
              positions[i * 2],
              this.lastKnownGodObjectPositions[i],
              positions[i * 2 + 1]));
      this.lastKnownGodObjectPositions[i] = positions[i * 2 + 1];
      if (
        this.lastKnownPositions[i] &&
        positions[i].difference(this.lastKnownPositions[i]).length() <= 0.0 &&
        Math.abs(positions[i].r - this.lastKnownPositions[i].r) <= 0.0) {
        continue;
      }
      this.lastKnownPositions[i] = positions[i * 2];
      this.emit('handleMoved', i, positions[i * 2]);
    }

    for (const hapticObject of this.hapticObjects) {
      hapticObject.updatePositions(handleMovements);
    }
  }

  /**
   * @description Logs debug message sent by the panto.
   * @param {string} string - The message sent by the panto.
   */
  debugLogCallback(string) {
    console.log(`[${this.port}] ` + string);
  }

  /**
   * @description Gets the last known position of the me handle.
   * @return {Vector} Last known position as vector.
   */
  getMePosition() {
    return this.lastKnownPositions[0];
  }

  /**
   * @description Gets the last known position of the it handle.
   * @return {Vector} Last known position as vector.
   */
  getItPosition() {
    return this.lastKnownPositions[1];
  }

  /**
   * @description Enqueues a packet to be send via the serial connection to the
   * panto.
   * @param {object} packet - Specifying the package to be sent.
   * @param {number} packet.messageType - Type id of message.
   * @param {number} [packet.data] - Containing the payload data, if needed.
   */
  send(packet) {
    this.sendQueue.push(packet);
  }

  /**
   * @description Enqueues a position packet to be send via the serial
   * connection to the panto.
   * @param {number} controlMethod - 0x00 Position, 0x01 Force rendering.
   * @param {number} pantoIndex - Which panto should be moved.
   * @param {Vector} position - Position to move to.
   */
  sendMotor(controlMethod, pantoIndex, position) {
    this.send({
      messageType: 0x90,
      data: [
        controlMethod,
        pantoIndex,
        position.x,
        position.y,
        position.r
      ]
    });
  }

  /**
   * @description Enqueues a PID tuning packet to be send
   * via the serial connection to the panto.
   * @param {number} motorIndex - Which motor should be tuned.
   * @param {number} p - New p value.
   * @param {number} i - New i value.
   * @param {number} d - New d value.
   */
  sendPID(motorIndex, p, i, d) {
    this.send({
      messageType: 0x91,
      data: {
        motorIndex: motorIndex,
        pid: [p, i, d]
      }
    });
  }

  /**
   * @description Debug: Request a dump of the physics' hashtable.
   * @param {number} [index=-1] - Index of affected handle, with -1 meaning
   * both.
   */
  sendDumpHashtable(index) {
    this.send({
      messageType: 0xC0,
      data: {
        index: index
      }
    });
  }

  /**
   * @description Sets new positions if handles are moved by ViDeb.
   * @param {number} index - Index of moved handle.
   * @param {Vector} position - Position the handle was moved to.
   */
  handleMoved(index, position) {
    position = new Vector(position.x, position.y, position.r);
    this.lastKnownPositions[index] = position;
    this.emit('handleMoved', index, position);
  }

  /**
   * @description Moves a Handle to a position.
   * @param {number} index - Index of handle to move.
   * @param {Vector} target - Position the handle should be moved to.
   */
  moveHandleTo(index, target) {
    this.lastTargetPositions[index] = target;
    this.emit('moveHandleTo', index, target);
    if (!this.serial) return;
    const values = target ? target : new Vector(NaN, NaN, NaN);
    this.sendMotor(0, index, values);
  }

  /**
   * @description Applies force vector to the pantograph.
   * @param {number} index - Index of the handle to apply force to.
   * @param {Vector} force - Force vector to render.
   * Third element will be ignored.
   */
  applyForceTo(index, force) {
    // this.emit('applyForceTo', index, force);
    if (!this.serial) return;
    const values = force ? force : new Vector(NaN, NaN, NaN);
    this.sendMotor(1, index, values);
  }

  /**
   * @description Rotates a Handle to target angle inside the global coordinate
   * system with zero beeing in postive x direction.
   * Positive rotation is counterclockwise.
   * @param {number} index - Index of handle to move.
   * @param {number} targetAngle - Angle in radiant the handle should be
   * rotated to.
   * @return {Promise} The promise executing the rotation.
   */
  rotateHandleTo(index, targetAngle) {
    return new Promise((resolve) => {
      this.emit('rotateHandleTo', index, targetAngle);
      this.moveHandleTo(index, new Vector(NaN, NaN, targetAngle));
      resolve(resolve);
    });
  }

  /**
   * @description  Returns a promise that invokes handle movement with tween
   * behaviour. Positive x goes to the right and positive y goes away from you.
   * The point (0,0) is between the motors.
   * @param {number} index - Index of handle to move.
   * @param {Vector} target - Position the handle should be moved to.
   * @param {number} [speed=120] - Speed of the movement in mm per second
   * (max value is 120).
   * @param {object} [interpolation_method=TWEEN.Easing.Quadratic.InOut] - Tween
   * function that is used to generate the movement.
   * @return {Promise} The promise executing the movement.
   */
  movePantoTo(
      index,
      target,
      speed = 120,
      interpolation_method = TWEEN.Easing.Quadratic.InOut) {
    if (!this.lastKnownPositions[index]) {
      setTimeout(() => this.movePantoTo(
          index, target, speed, interpolation_method), 500);
      return new Promise((resolve) => {
        resolve(resolve);
      });
    }
    if (speed > 120) {
      console.log(
          speed,
          ' is too fast! Please keep your motors save' +
          ' with a maximum speed of 120mm/s!');
      speed = 120;
    }
    return new Promise((resolve) => {
      const distance = target.difference(this.lastKnownPositions[index])
          .length();
      const duration = (distance / speed) * 1000;
      this.tweenPantoTo(index, target, duration, interpolation_method);
      const listener = new PositionListener(this, index, target);
      listener.once('positionReached', () => resolve(resolve));
    });
  }

  /**
   * @description Returns a promise that unblocks a handle.
   * @param {number} index - Index of handle to unblock.
   * @return {Promise} The promise executing the unblock.
   */
  unblockHandle(index) {
    return new Promise((resolve) => {
      this.unblock(index);
      resolve(resolve);
    });
  }

  /**
   * @description Unblocks a handle.
   * @param {number} index - Index of handle to unblock.
   */
  unblock(index) {
    this.moveHandleTo(index);
  }

  /**
   * @description Moves a handle with tween movement behaviour.
   * @param {number} index - Index of handle to move.
   * @param {Vector} target - Position the handle should be moved to.
   * @param {number} [duration=500] - Time in ms that the movement shall take.
   * @param {object} [interpolation_method=TWEEN.Easing.Quadratic.InOut] - Tween
   * function that is used to generate the movement.
   */
  tweenPantoTo(
      index,
      target,
      duration = 500,
      interpolation_method = TWEEN.Easing.Quadratic.InOut) {
    const tweenPosition = this.lastKnownPositions[index];
    if (tweenPosition) {
      tweenStackCounter++;
      if (tweenStackCounter == 1) setTimeout(animateTween, TWEEN_INTERVAL);

      // Create a new tween that modifies 'tweenPosition'.
      new TWEEN.Tween(tweenPosition)
          .to(target, duration)
      //  Use an easing function to make the animation smooth.
          .easing(interpolation_method)
          .onUpdate(() => {
            // Called after tween.js updates 'tweenPosition'.
            this.moveHandleTo(index, tweenPosition);
          })
          .onComplete(() => {
            tweenStackCounter--;
          })
          .start(); // Start the tween immediately.
    }
  }

  /**
   * @description Sends a line to the graphical debugger to be drawn.
   * @param {Array} line - An array containig two {Vectors}
   * representing the two edge points of the line.
   * @param {string} color - A html conform string to define a color.
   */
  mapLine(line, color) {
    this.emit('mapLine', line, color);
  }

  /**
   * @description Sends a point to the graphical debugger to be drawn.
   * @param {Vector} pos - The center position of the Point.
   * @param {number} size - The diameter of the point.
   * @param {string} color - A html conform string to define a color.
   */
  mapPoint(pos, size, color) {
    this.emit('drawCircle', pos, size, color);
  }

  /**
   * @description Adds an existing haptic object to the device
   * or adds a new haptic object if a vector is passed.
   * This also sets this device as the object's device.
   * @param {HapticObject|Vector} input - The existing haptic object
   * or the position for the new haptic object.
   * @return {HapticObject} The added haptic object.
   */
  addHapticObject(input) {
    let hapticObject;
    if (input instanceof HapticObject) {
      hapticObject = input;
    } else if (input instanceof Vector) {
      hapticObject = new HapticObject(input);
    } else {
      return undefined;
    }
    this.hapticObjects.push(hapticObject);
    hapticObject.device = this;
    return hapticObject;
  }
}

/**
 * @description helper function for updating tween regularly
 */
function animateTween() {
  TWEEN.update();
  if (tweenStackCounter > 0) setTimeout(animateTween, TWEEN_INTERVAL);
}

module.exports = Device;

// needs to be after export because of the following dependencies:
// device -> shared -> broker -> device
const {broker} = require('./broker');
