'use strict';

const serial = require('../build/Debug/serial');
const Vector = require('./vector');
const EventEmitter = require('events').EventEmitter;
const TWEEN = require('@tweenjs/tween.js');
const TWEEN_INTERVAL = 30;
const MoveableObject = require('./moveableObject');
const Obstacle = require('./obstacle');
const Forcefield = require('./forcefield');

let tween_stack_counter = 0;

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
    this.me = new MoveableObject();
    this.it = new MoveableObject();
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
      for (let message of this.sendQueue) {
        serial.send(this.serial, message.messageType, message.data);
      }
    }
    this.sendQueue.length = 0;
  }

  syncCallback() {
    this.send({
      messageType: 0x80
    });
    this.lastReceiveTime = process.hrtime();
  }

  heartbeatCallback() {
    this.send({
      messageType: 0x81
    });
    this.lastReceiveTime = process.hrtime();
  }

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
   * Enqueues a position packet to be send via the serial connection to the panto.
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
   * Enqueues a PID tuning packet to be send via the serial connection to the panto.
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
   * @return {Obstacle} the created obstacle
   */
  createObstacle(pointArray, index = -1) {
    const obstacle = new Obstacle(pointArray);
    if(index == -1) {
      this.me.addObstacle(obstacle);
      this.it.addObstacle(obstacle);
    } else if(index == 0) {
      this.me.addObstacle(obstacle);
    } else if(index == 1) {
      this.it.addObstacle(obstacle);
    }
    this.emit('createObstacle', index, obstacle.id, pointArray);
    return obstacle;
  }

  /**
   * Remove obstacles for handles
   * @param {Obstacle} obstacle - the obstacle that should be removed
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  removeObstacle(obstacle, index = -1) {
    if (index == -1) {
      this.me.removeObstacle(obstacle);
      this.it.removeObstacle(obstacle);
    } else if (index == 0) {
      this.me.removeObstacle(obstacle);
    } else if (index == 1) {
      this.it.removeObstacle(obstacle);
    }
    this.emit('removeObstacle', index, obstacle.id);
  }

  /**
   * Creates forcefields for handles
   * @param {array} pointArray - array containing edge points of the forcefield
   * @param {function} handleFunction - function that translates a point to a force (see example folder)
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   * @return {Forcefield} the created forcefield
   */
  createForcefield(pointArray, handleFunction, index = -1) {
    const forcefield = new Forcefield(pointArray, handleFunction);
    if (index == -1) {
      this.me.addForcefield(forcefield);
      this.it.addForcefield(forcefield);
    } else if (index == 0) {
      this.me.addForcefield(forcefield);
    } else if (index == 1) {
      this.it.addForcefield(forcefield);
    }
    return Forcefield;
  }

  /**
   * Remove forcefields for handles
   * @param {Forcefield} forcefield - forcefield to be removed
   * @param {number} [index =-1] - index of affected handle with -1 meaning both
   */
  removeForcefield(forcefield, index = -1) {
    if (index == -1) {
      this.me.removeForcefield(forcefield);
      this.it.removeForcefield(forcefield);
    } else if (index == 0) {
      this.me.removeForcefield(forcefield);
    } else if (index == 1) {
      this.it.removeForcefield(forcefield);
    }
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
   * @param {Vector} force - force vector to render. Third element will be ignored.
   */
  applyForceTo(index, force) {
    // this.emit('applyForceTo', index, force);
    if (!this.serial) return;
    const values = force ? force : new Vector(NaN, NaN, NaN);
    this.sendMotor(1, index, values);
  }

  /**
   * Rotates a Handle to target angle inside the global coordinate system with zero beeing in postive x direction.
   * Positive rotation is counterclockwise.
   * @param {number} index - index of handle to move
   * @param {number} targetAngle - angle in radiant the handle should be rotated to
   */
  rotateHandleTo(index, targetAngle) {
    return new Promise(resolve => {
      this.emit('rotateHandleTo', index, targetAngle);
      this.moveHandleTo(index, new Vector(NaN, NaN, targetAngle));
      resolve(resolve);
    });
  }

  /**
   * Returns a promise that invokes handle movement with tween behaviour. Positive x goes to the right and positive y goes away from you.
   * The point (0,0) is between the motors.
   * @param {number} index - index of handle to move
   * @param {Vector} target - position the handle should be moved to
   * @param {number} [speed=120] - speed of the movement in mm per second (max value is 120).
   * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.InOut] - tween function that is used to generate the movement.
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
          ' is too fast! Please keep your motors save with a maximum speed of 120mm/s!');
      speed = 120;
    }
    return new Promise(resolve => {
      const distance = target.difference(this.lastKnownPositions[index]).length();
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
    return new Promise(resolve => {
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
   * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.InOut] - tween function that is used to generate the movement.
   */
  tweenPantoTo(
      index,
      target,
      duration = 500,
      interpolation_method = TWEEN.Easing.Quadratic.InOut) {
    let tweenPosition = this.lastKnownPositions[index];
    if (tweenPosition) {
      tween_stack_counter++;
      if (tween_stack_counter == 1) setTimeout(animateTween, TWEEN_INTERVAL);

      const tween = new TWEEN.Tween(tweenPosition) // Create a new tween that modifies 'tweenPosition'.
        .to(target, duration)
        .easing(interpolation_method) // Use an easing function to make the animation smooth.
        .onUpdate(() => {
          // Called after tween.js updates 'tweenPosition'.
          this.moveHandleTo(index, tweenPosition);
        })
        .onComplete(() => {
          tween_stack_counter--;
        })
        .start(); // Start the tween immediately.
    }
  }

  /**
   * Represents the timesteps for moving objects
   */
  step() {
    for (let i = 0; i < 2; i++) {
      const object = i == 0 ? this.me : this.it;
      const difference = this.lastKnownPositions[i].difference(object.position);
      object.setMovementDirection(difference);
      object.move();
      if (object.processingObstacleCollision) {
        this.applyForceTo(i, object.activeForce);
      } else if (object.doneColliding) {
        this.unblock(i);
      }
    }
  }
}

function animateTween() {
  TWEEN.update();
  if (tween_stack_counter > 0) setTimeout(animateTween, TWEEN_INTERVAL);
}

module.exports = Device;

// needs to be after export because of the following dependencies:
// device -> shared -> broker -> device
const { broker } = require('./shared');
