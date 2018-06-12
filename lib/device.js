'use strict';

const serial = require('../build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('../Vector.js'),
      EventEmitter = require('events').EventEmitter,
      TWEEN = require('@tweenjs/tween.js'),
      TWEEN_INTERVAL = 30,
      MoveableObject = require('./moveableObject.js'),
      Obstacle = require('./obstacle.js');

let tween_stack_counter = 0;
const bigPantoForceScale = 0.1125;
const smallPantoForceScale = 0.125;

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
        if(port == 'virtual') {
            let index = 0;
            port = 'virtual0';
            while(broker.devices.has(port))
                port = 'virtual'+(index++);
        } else {
            if(process.platform == 'darwin') // macOS
                port = port.replace('/tty.', '/cu.');
            else if(process.platform == 'win32') // windows
                port = '//.//'+port;
            if(broker.devices.has(port))
                return broker.devices.get(port);
            this.serial = true;
        }
        this.port = port;
        this.sendQueueIndex = 0;
        this.sendQueue = [[], []];
        this.lastKnownPositions = [];
        this.lastKnownPositions[0] = new Vector(0, 0, 0);
        this.lastKnownPositions[1] = new Vector(0, 0, 0);
        this.lastTargetPositions = [];
        this.lastReceiveTime = process.hrtime();
        broker.devices.set(this.port, this);
        if(this.serial)
            this.serial = serial.open(this.port);
        this.me = new MoveableObject();
        this.it = new MoveableObject();
    }

    /**
     * Disconnect the device.
     */
    disconnect() {
        if(this.serial)
            serial.close(this.serial);
        broker.devices.delete(this.port);
    }

    /**
     * Pulls new data from serial connection and handles them.
     */
    poll() {
        if(!this.serial)
            return;
        const time = process.hrtime();
        if(time[0] > this.lastReceiveTime[0]+broker.disconnectTimeout) {
            this.disconnect();
            return;
        }
        const packets = serial.poll(this.serial);
        if(packets.length == 0)
            return;
        this.lastReceiveTime = time;
        const packet = packets[packets.length-1];
        if(packet.length == 16)
            this.hardwareConfigHash = packet;
        else if(packet.length == 4*6) {
            for(let i = 0; i < 2; ++i) {
                const newPosition = new Vector(packet.readFloatLE(i*12), packet.readFloatLE(i*12+4), packet.readFloatLE(i*12+8));
                if(this.lastKnownPositions[i] && newPosition.difference(this.lastKnownPositions[i]).length() <= 0.0)
                    continue;
                this.lastKnownPositions[i] = newPosition;
                this.emit('handleMoved', i, this.lastKnownPositions[i]);
            }
        }
        const queue = this.sendQueue[this.sendQueueIndex];
        if(this.serial && queue.length > 0) {
            serial.send(this.serial, queue[queue.length-1]);
        }
        queue.length = 0;
        this.sendQueueIndex = 1-this.sendQueueIndex; // Next turn (for 2 pantos per device)
    }

    /**
     * gets the last known position of the me handle
     * @return {Vector} last known position as vector
    */
    getMePosition(){
      return this.lastKnownPositions[0];
    }

    /**
     * gets the last known position of the it handle
     * @return {Vector} last known position as vector
    */
    getItPosition(){
      return this.lastKnownPositions[1];
    }

    /**
     * Enqueues a packet to be send via the serial connection to the panto.
     * @param {number} index - index of handle to send to
     * @param {Buffer} packet - containing the payload data
     */
    send(index, packet) {
        this.sendQueue[index].push(packet);
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
    createObstacle(pointArray, index=-1){
      const obstacle = new Obstacle(pointArray);
      if(index == -1){
        this.me.addObstacle(obstacle);
        this.it.addObstacle(obstacle);
      }else if(index == 0){
        this.me.addObstacle(obstacle);
      }else if(index == 1){
        this.it.addObstacle(obstacle);
      }
      return obstacle;
    }

    /**
     * Remove obstacles for handles
     * @param {array} pointArray - array containing edge points of the obstacle
     * @param {number} [index =-1] - index of affected handle with -1 meaning both
    */
    removeObstacle(obstacle, index =-1){
      if(index == -1){
        this.me.removeObstacle(obstacle);
        this.it.removeObstacle(obstacle);
      }else if(index == 0){
        this.me.removeObstacle(obstacle);
      }else if(index == 1){
        this.it.removeObstacle(obstacle);
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
        if(!this.serial)
            return;
        const values = (target) ? [target.x, target.y, target.r] : [NaN, NaN, NaN],
              packet = new Buffer(1+1+3*4);
        packet[0] = 0; // control method : POSITION
        packet[1] = index;
        packet.writeFloatLE(values[0], 2);
        packet.writeFloatLE(values[1], 6);
        packet.writeFloatLE(values[2], 10);
        this.send(index, packet);
    }

    /**
     * applies force vector to the pantograph
     * @param {number} index - index of handle to apply force
     * @param {Vector} target - vector of force to render. 3rd element will be ignored.
     */
    applyForceTo(index, force) {
        this.emit('applyForceTo', index, force);
        if(!this.serial)
            return;
        const values = (force) ? [force.x, force.y, 0] : [NaN, NaN, NaN],
              packet = new Buffer(1+1+3*4);
        packet[0] = 1; // control method : FORCE
        packet[1] = index;
        packet.writeFloatLE(values[0], 2);
        packet.writeFloatLE(values[1], 6);
        packet.writeFloatLE(values[2], 10);
        this.send(index, packet);
    }

    /**
     * Returns a promise that invokes handle movement with tween behaviour
     * @param {number} index - index of handle to move
     * @param {Vector} target - position the handle should be moved to
     * @param {number} [duration=500] - time in ms that the movement shall take.
     * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.Out] - tween function that is used to generate the movement.
     * @return {promise} the promise executing the movement
     */
    movePantoTo(index, target, duration = 500, interpolation_method = TWEEN.Easing.Quadratic.Out) {
        return new Promise (resolve => {
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
        return new Promise (resolve => {
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
     * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.Out] - tween function that is used to generate the movement.
     */
    tweenPantoTo(index, target, duration = 500, interpolation_method = TWEEN.Easing.Quadratic.Out) {
        let tweenPosition = undefined;
        if(index == 0 && this.lastKnownPositions[0]) {
            tweenPosition = this.lastKnownPositions[0];
        } else if(index == 1 && this.lastKnownPositions[1]) {
            tweenPosition = this.lastKnownPositions[1];
        }
        if(tweenPosition) {
            tween_stack_counter++;
            if(tween_stack_counter == 1)
                setTimeout(animateTween, TWEEN_INTERVAL);

            const tween = new TWEEN.Tween(tweenPosition) // Create a new tween that modifies 'tweenPosition'.
            .to(target, duration)
            .easing(interpolation_method) // Use an easing function to make the animation smooth.
            .onUpdate(() => { // Called after tween.js updates 'tweenPosition'.
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
    step(){
      for(let i = 0; i < 2; i++){
        const object = (i == 0) ? this.me : this.it;
        const difference = this.lastKnownPositions[i].difference(object.position);
        object.setMovementDirection(difference);
        object.move();
        if(object.processingCollision){
          const force = object.position.difference(this.lastKnownPositions[i]).scale(smallPantoForceScale);
          this.applyForceTo(i, force);
        }else if(object.doneColliding){
          this.unblock(i);
        }
      }
    }
}

function animateTween() {
    TWEEN.update();
    if(tween_stack_counter > 0)
        setTimeout(animateTween, TWEEN_INTERVAL);
}

module.exports = Device;

// needs to be after export because of the following dependencies:
// device -> shared -> broker -> device
// javascript is so mouch fun :D
const {broker} = require('./shared');
