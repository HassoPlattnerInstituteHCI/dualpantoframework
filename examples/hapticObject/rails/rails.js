/* eslint-disable require-jsdoc */
const DualPantoFramework = require('../../../lib/dualpantoframework');
const {Broker, open} = DualPantoFramework;

const {scene1} = require('./scenes');
/**
 * @type {import('../../../lib/device')}
 */
let device;

const stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

Broker.on('devicesChanged', function(devices) {
  for (const newdevice of devices) {
    if (!device) {
      device = newdevice;
      open('http://localhost:8080/map.html');
      setTimeout(start, 1000);
    }
  }
});

function start() {
  scene1(device);
}
