'use strict';

const serial = require('../build/Release/serial');
const Vector = require('./vector');
const EventEmitter = require('events').EventEmitter;
const TWEEN = require('@tweenjs/tween.js');
const TWEEN_INTERVAL = 30;

let tweenStackCounter = 0;

/** Class for panto interaction.
 * @extends EventEmitter
 */
class Device extends EventEmitter {
  /**
   * Creates a new device.
   * @param {String} port - port on that the device is connected.
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
    this.lastKnownPositions[0] = new Vector(0, 0, 0);
    this.lastKnownPositions[1] = new Vector(0, 0, 0);
    this.lastTargetPositions = [];
    this.lastReceiveTime = process.hrtime();
    broker.devices.set(this.port, this);
    try {
      if (this.serial) this.serial = serial.open(this.port);
    } catch (err) {
      console.log(err);
    }
    this.nextObstacleId = 0;
    this.usedObstacleIds = new Set();
  }

  /**
   * Disconnect the device.
   */
  disconnect() {
    if (this.serial) serial.close(this.serial);
    broker.devices.delete(this.port);
  }

  /**
   * Pulls new data from serial connection and handles them.
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
   * replies to sync messages with an acknowledgement message
   */
  syncCallback() {
    this.send({
      messageType: 0x80
    });
    this.lastReceiveTime = process.hrtime();
  }

  /**
   * replies to heartbeat messages with an acknowledgement message
   */
  heartbeatCallback() {
    this.send({
      messageType: 0x81
    });
    this.lastReceiveTime = process.hrtime();
  }

  /**
   * handles position sent from the panto
   * @param {array} positions the positions sent by the panto
   */
  positionCallback(positions) {
    for (let i = 0; i < 2; ++i) {
      if (
        this.lastKnownPositions[i] &&
        positions[i].difference(this.lastKnownPositions[i]).length() <= 0.0 &&
        Math.abs(positions[i].r - this.lastKnownPositions[i].r) <= 0.0) {
        continue;
      }
      this.lastKnownPositions[i] = positions[i];
      this.emit('handleMoved', i, positions[i]);
    }
  }

  /**
   * logs debug message sent by the panto
   * @param {string} string the message sent by the panto
   */
  debugLogCallback(string) {
    console.log(`[${this.port}] ` + string);
  }

  /**
   * gets the last known position of the me handle
   * @return {Vector} last known position as vector
   */
  getMePosition() {
    return this.lastKnownPositions[0];
  }

  /**
   * gets the last known position of the it handle
   * @return {Vector} last known position as vector
   */
  getItPosition() {
    return this.lastKnownPositions[1];
  }

  /**
   * Enqueues a packet to be send via the serial connection to the panto.
   * @param {object} packet - specifying the package to be sent
   * @param {number} packet.messageType - type id of message
   * @param {number} [packet.data] - containing the payload data, if needed
   */
  send(packet) {
    this.sendQueue.push(packet);
  }

  /**
   * Enqueues a position packet to be send via the
   * serial connection to the panto.
   * @param {number} controlMethod - 0x00 Position, 0x01 Force rendering
   * @param {number} pantoIndex - which panto should be moved
   * @param {Vector} position - position to move to
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
   * Enqueues a PID tuning packet to be send
   * via the serial connection to the panto.
   * @param {number} motorIndex - which motor should be tuned
   * @param {number} p - new p value
   * @param {number} i - new i value
   * @param {number} d - new d value
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
   * Enqueues a packet defining a new obstacle to be send
   * via the serial connection to the panto.
   * @param {array} pointArray - array containing edge points of the obstacle
   * @param {number} id - the obstacle's unique id
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  sendCreateObstacle(pointArray, id, index) {
    this.send({
      messageType: 0xA0,
      data: {
        posArray: pointArray.reduce((posArray, point) => {
          posArray.push(point.x);
          posArray.push(point.y);
          return posArray;
        }, []),
        id: id,
        index: index
      }
    });
  }

  /**
   * Enqueues a packet removing an existing obstacle to be send
   * via the serial connection to the panto.
   * @param {number} id - the obstacle's unique id
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  sendRemoveObstacle(id, index) {
    this.send({
      messageType: 0xA1,
      data: {
        id: id,
        index: index
      }
    });
  }

  /**
   * Enqueues a packet enabling an existing obstacle to be send
   * via the serial connection to the panto.
   * @param {number} id - the obstacle's unique id
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  sendEnableObstacle(id, index) {
    this.send({
      messageType: 0xA2,
      data: {
        id: id,
        index: index
      }
    });
  }

  /**
   * Enqueues a packet disabling an existing obstacle to be send
   * via the serial connection to the panto.
   * @param {number} id - the obstacle's unique id
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  sendDisableObstacle(id, index) {
    this.send({
      messageType: 0xA3,
      data: {
        id: id,
        index: index
      }
    });
  }

  /**
   * sets new positions if handles are moved by ViDeb
   * @param {number} index - index of moved handle
   * @param {Vector} position - position the handle was moved to
   */
  handleMoved(index, position) {
    position = new Vector(position.x, position.y, position.r);
    this.lastKnownPositions[index] = position;
    this.emit('handleMoved', index, position);
  }

  /**
   * Creates obstacles for handles
   * @param {array} pointArray - array containing edge points of the obstacle
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   * @return {number} the created obstacle'd id
   */
  createObstacle(pointArray, index = -1) {
    while (this.usedObstacleIds.has(this.nextObstacleId)) {
      this.nextObstacleId = (this.nextObstacleId + 1) % 0xFFFF;
    }

    const id = this.nextObstacleId;
    this.nextObstacleId = (this.nextObstacleId + 1) % 0xFFFF;
    this.usedObstacleIds.add(id);
    this.sendCreateObstacle(pointArray, id, index);
    this.emit('createObstacle', index, id, pointArray);

    return id;
  }

  /**
   * Remove obstacles for handles
   * @param {number} id - the id of the obstacle that should be removed
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  removeObstacle(id, index = -1) {
    this.usedObstacleIds.delete(id);
    this.sendRemoveObstacle(id, index);
    this.emit('removeObstacle', index, id);
  }

  /**
   * Enable obstacles for handles
   * @param {number} id - the id of the obstacle that should be enabled
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  enableObstacle(id, index = -1) {
    this.sendEnableObstacle(id, index);
    this.emit('enableObstacle', index, id);
  }

  /**
   * Disable obstacles for handles
   * @param {number} id - the id of the obstacle that should be disabled
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  disableObstacle(id, index = -1) {
    this.sendDisableObstacle(id, index);
    this.emit('disableObstacle', index, id);
  }

  /**
   * Creates forcefields for handles
   * @param {array} pointArray - array containing edge points
   * of the forcefield
   * @param {function} handleFunction - function that translates a point
   * to a force (see example folder)
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   * @return {Forcefield} the created forcefield
   */
  createForcefield(pointArray, handleFunction, index = -1) {
    // TODO: re-add once this is implemented on the firmware
    throw new Error('Not implemented');
    return null;
  }

  /**
   * Remove forcefields for handles
   * @param {Forcefield} forcefield - forcefield to be removed
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  removeForcefield(forcefield, index = -1) {
    // TODO: re-add once this is implemented on the firmware
    throw new Error('Not implemented');
  }

  /**
   * moves a Handle to a position
   * @param {number} index - index of handle to move
   * @param {Vector} target - position the handle should be moved to
   */
  moveHandleTo(index, target) {
    this.lastTargetPositions[index] = target;
    this.emit('moveHandleTo', index, target);
    if (!this.serial) return;
    const values = target ? target : new Vector(NaN, NaN, NaN);
    this.sendMotor(0, index, values);
  }

  /**
   * applies force vector to the pantograph
   * @param {number} index - index of the handle to apply force to
   * @param {Vector} force - force vector to render.
   * Third element will be ignored.
   */
  applyForceTo(index, force) {
    // this.emit('applyForceTo', index, force);
    if (!this.serial) return;
    const values = force ? force : new Vector(NaN, NaN, NaN);
    this.sendMotor(1, index, values);
  }

  /**
   * Rotates a Handle to target angle inside the global coordinate system with
   * zero beeing in postive x direction.
   * Positive rotation is counterclockwise.
   * @param {number} index - index of handle to move
   * @param {number} targetAngle - angle in radiant the handle
   * should be rotated to
   * @return {promise} the promise executing the rotation
   */
  rotateHandleTo(index, targetAngle) {
    return new Promise((resolve) => {
      this.emit('rotateHandleTo', index, targetAngle);
      this.moveHandleTo(index, new Vector(NaN, NaN, targetAngle));
      resolve(resolve);
    });
  }

  /**
   * Returns a promise that invokes handle movement with tween behaviour.
   * Positive x goes to the right and positive y goes away from you.
   * The point (0,0) is between the motors.
   * @param {number} index - index of handle to move
   * @param {Vector} target - position the handle should be moved to
   * @param {number} [speed=120] - speed of the movement
   * in mm per second (max value is 120).
   * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.InOut] - tween
   * function that is used to generate the movement.
   * @return {promise} the promise executing the movement
   */
  movePantoTo(
      index,
      target,
      speed = 120,
      interpolation_method = TWEEN.Easing.Quadratic.InOut) {
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
      resolve(resolve);
    });
  }

  /**
   * Returns a promise that unblocks a handle
   * @param {number} index - index of handle to unblock
   * @return {promise} the promise executing the unblock
   */
  unblockHandle(index) {
    return new Promise((resolve) => {
      this.unblock(index);
      resolve(resolve);
    });
  }

  /**
   * Unblocks a handle
   * @param {number} index - index of handle to unblock
   */
  unblock(index) {
    this.moveHandleTo(index);
  }

  /**
   * Moves a handle with tween movement behaviour
   * @param {number} index - index of handle to move
   * @param {Vector} target - position the handle should be moved to
   * @param {number} [duration=500] - time in ms that the movement shall take.
   * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.InOut] - tween
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
   * Sends a line to the graphical debugger to be drawn.
   * @param {array} line - An array containig two {Vectors}
   * representing the two edge points of the line.
   * @param {String} color - A html conform string to define a color.
   */
  mapLine(line, color) {
    this.emit('mapLine', line, color);
  }
}

/**
 * helper function for updating tween regularly
 */
function animateTween() {
  TWEEN.update();
  if (tweenStackCounter > 0) setTimeout(animateTween, TWEEN_INTERVAL);
}

module.exports = Device;

// needs to be after export because of the following dependencies:
// device -> shared -> broker -> device
const {broker} = require('./shared');
