'use strict';
const DualPantoFramework = require('../..');
const {Vector, Broker, Components, open} = DualPantoFramework;
const {
  Mesh,
  MeshCollider} = Components;
const keypress = require('keypress');
let device;
let component;
let object;
Broker.on('devicesChanged', function(devices) {
  for (const newdevice of devices) {
    if (!device) {
      device = newdevice;
      start();
    }
  }
});

const start = function() {
  open('http://localhost:8080/map.html');
  setTimeout(generateLevel, 3000);
};

keypress(process.stdin);


const generateLevel = () => {
  object = device.addHapticObject(new Vector(0, -100));
  const mesh = object.addComponent(new Mesh([
    new Vector(-100, 0),
    new Vector(100, 0),
    new Vector(100, -100),
    new Vector(-100, -100)
  ]));
  component = object.addComponent(new MeshCollider(mesh));
};


process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('keypress', function(ch, key) {
  if (key && key.name == 'e') {
    component.enable();
  }
  if (key && key.name == 'd') {
    component.disable();
  }
  if (key && key.name == 'a') {
    component = object.addComponent(component);
  }
  if (key && key.name == 'r') {
    object.removeComponent(component);
  }
  if (key && key.ctrl && key.name == 'c') {
    process.stdin.pause();
    process.exit();
  }
});
