const DualPantoFramework = require('../..');
const {Vector, Broker, Components, open} = DualPantoFramework;
const {
  Mesh,
  MeshCollider,
  BoxForcefield,
  ForcefieldSampleFunctions} = Components;
const VoiceInteraction = Broker.voiceInteraction;
let device;

Broker.on('devicesChanged', function(devices) {
  for (const newdevice of devices) {
    if (!device) {
      device = newdevice;
      start();
    }
  }
});

const start = () => {
  open('http://localhost:8080/map.html');
  setTimeout(doStuff, 3000);
};

const doStuff = () => {
  const hapticMeshObject0 = device.addHapticObject(new Vector(-89.878613,
      -76.828147));
  const mesh0 = hapticMeshObject0.addComponent(new Mesh([
    new Vector(0, 0),
    new Vector(21.762363000000008, -38.966543),
    new Vector(2.5083079999999995, -49.71970300000001),
    new Vector(-19.254056000000006, -10.753169999999997)
  ]));// path6206
  const collider = hapticMeshObject0.addComponent(new MeshCollider(mesh0));
  //
  const leftHapticObject = device.addHapticObject(
      new Vector(0, -150));
  const forcefield = leftHapticObject.addComponent(
      new BoxForcefield(
          new Vector(50, 50),
          ForcefieldSampleFunctions.directedForce.bind(
              undefined,
              new Vector(1, 0))));
  VoiceInteraction.speakText('Forcefield', 'EN').then(() => forcefield.trace())
      .then(() => VoiceInteraction.speakText('Collider', 'EN'))
      .then(() => collider.trace()).then(() => device.unblockHandle(1));
};
