'use strict';
const DualPantoFramework = require('../..');
const {Vector, Broker, Components, open} = DualPantoFramework;
const {
  Mesh,
  MeshCollider} = Components;
const VoiceInteraction = Broker.voiceInteraction;

const connected = [];
const positions = [new Vector(-60, -115), new Vector(60, - 100)];
let readyCount = 0;
let catchingEnabled = false;

Broker.on('devicesChanged', function(devices) {
  start();
  for (const newdevice of devices) {
    if (!connected.includes(newdevice)) {
      connected.push(newdevice);
    }
    if (connected.length == 2) {
      connected.forEach((d, i) => {
        d.movePantoTo(0, positions[i]).then(() => oneReady(i, 0));
        d.movePantoTo(1, positions[other(i)]).then(() => oneReady(i, 1));
      });
    }
  }
});

const oneReady = function(panto, handle) {
  readyCount++;
  console.log(
      'Panto', panto,
      'handle', handle,
      'reached its target. Only', 4 - readyCount, 'to go.');
  if (readyCount == 4) {
    allReady();
  }
};

const allReady = function() {
  connected.forEach((d, i) => {
    generateLevel(d);
    d.unblockHandle(0);
    d.unblockHandle(1);
    d.on('handleMoved', (index, pos) => {
      // console.log(
      //     'Panto', i,
      //     'handle', index,
      //     'moved to', pos);
      if (index == 0) {
        connected[other(i)].moveHandleTo(1, pos);
        positions[i] = pos;
        if (catchingEnabled &&
            positions[0].difference(positions[1]).length() < 5) {
          catchingEnabled = false;
          VoiceInteraction.speakText(
              'Success! Now it\'s the other player\s turn.', 'EN');
          setTimeout(() => {
            catchingEnabled = true;
          }, 2000);
        }
      }
    });
  });
  catchingEnabled = true;
  VoiceInteraction.speakText('Left player: catch the right player.', 'EN');
};

const other = function(i) {
  return i == 0 ? 1 : 0;
};

const start = function() {
  open('http://localhost:8080/map.html');
};

const generateLevel = function(device) {
  const hapticMeshObject0 = device.addHapticObject(new Vector(-14, -77));
  const mesh0 = hapticMeshObject0.addComponent(new Mesh([
    new Vector(0, 0),
    new Vector(0, -54),
    new Vector(10, -54),
    new Vector(10, 0)
  ]));// rect2153
  hapticMeshObject0.addComponent(new MeshCollider(mesh0));
  const hapticMeshObject1 = device.addHapticObject(new Vector(18, -93));
  const mesh1 = hapticMeshObject1.addComponent(new Mesh([
    new Vector(0, 0),
    new Vector(0, -60),
    new Vector(11, -60),
    new Vector(11, 0)
  ]));// rect2155
  hapticMeshObject1.addComponent(new MeshCollider(mesh1));
  const hapticMeshObject2 = device.addHapticObject(new Vector(-95, -150));
  const mesh2 = hapticMeshObject2.addComponent(new Mesh([
    new Vector(0, 0),
    new Vector(68, 0),
    new Vector(68, -25),
    new Vector(145, -25),
    new Vector(145, 18),
    new Vector(185, 18),
    new Vector(185, 80),
    new Vector(0, 80)
  ]));// path2151
  hapticMeshObject2.addComponent(new MeshCollider(mesh2));
};
