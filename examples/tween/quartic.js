'use strict';

const {Broker, Vector} = require('../..');
const TWEEN = require('@tweenjs/tween.js');
const interpolationMethod = TWEEN.Easing.Quartic.InOut;
const waitTime = 1000;
const testBothHandles = false;

Broker.on('devicesChanged', function(devices, attached, detached) {
  const handles = (testBothHandles?1:0);
  for (const device of devices) {
    if (device) {
      let promiseList = [];
      for (let i = 1; i < 4; i++) {
        for (let handleIndex = 0; handleIndex <= handles; handleIndex++) {
          promiseList = promiseList.concat(
              [
                () => device.movePantoTo(handleIndex, new Vector(-100, -100),
                    40 * i, interpolationMethod),
                () => Broker.waitMS(waitTime),
                () => device.movePantoTo(handleIndex, new Vector(0, -100),
                    40 * i, interpolationMethod),
                () => Broker.waitMS(waitTime),
                () => device.movePantoTo(handleIndex, new Vector(100, -100),
                    40 * i, interpolationMethod),
                () => Broker.waitMS(waitTime),
                () => device.unblockHandle(handleIndex)
              ]);
        }
      }
      Broker.runScript(promiseList);
    }
  }
});
