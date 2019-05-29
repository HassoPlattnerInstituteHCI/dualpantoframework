/* eslint-disable require-jsdoc */
const DualPantoFramework = require('../..');
const {Vector, Broker} = DualPantoFramework;
const VoiceInteraction = Broker.voiceInteraction;
let device;
let follow = false;
const hotels = [new Vector(50, -50, 0), new Vector(75, -75, 0)];
let area = 'start';

Broker.on('devicesChanged', function(devices) {
  for (const newdevice of devices) {
    if (!device) {
      device = newdevice;
      start();
    }
  }
});

function inArea(positionMe, positionHotel) {
  return positionMe.difference(positionHotel).length() <= 10;
}

function getArea(position) {
  let area = '';
  if (inArea(position, hotels[0])) {
    area = 'first_Hotel';
  } else if (inArea(position, hotels[1])) {
    area = 'second_Hotel';
  } else {
    area = 'start';
  }
  return area;
}

function start() {
  VoiceInteraction.setCommands(['hotel']);
  device.on('handleMoved', function(index, position) {
    if (follow && index == 0) {
      if (!(getArea(position) === area)) {
        area = getArea(position);
        nearbyLocation(area);
      }
    }
  });

  Broker.runScript([
    () => VoiceInteraction.speakText('Willkommen zu Homefinder!'),
    () => Broker.waitMS(500),
    () => VoiceInteraction.speakText('Sie sind aktuell hier.'),
    () => device.movePantoTo(0, new Vector(-50, -75, 0)),
    () => Broker.waitMS(500),
    () => VoiceInteraction.speakText('Lass mich dir die Gegend zeigen.'),
    () => device.movePantoTo(1, new Vector(-50, -75, 0)),
    // TODO: here display a square around the field

    () => VoiceInteraction.speakText(
        'Du kannst Hotels sagen und ich zeige dir Hotelstandorte.'),
    () => Broker.waitMS(500),
    () => device.unblockHandle(0),
    () => refollow(),
    () => VoiceInteraction.beginListening()
  ]);

  VoiceInteraction.on('keywordRecognized', function(word) {
    if (word === 'hotel') {
      showHotels();
    }
  });
}


function showHotels() {
  DualPantoFramework.runScript([
    () => VoiceInteraction.speakText('Das'),
    () => device.movePantoTo(1, new Vector(50, -50, 0)),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('ist Hotel Adlon'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Das'),
    () => device.movePantoTo(1, new Vector(50, -75, 0)),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('ist Hotel Air B&B'),
    () => DualPantoFramework.waitMS(500)
  ]);
}

function nearbyLocation(area) {
  if (area === 'first_Hotel') {
    follow = false;
    DualPantoFramework.runScript([
      () => VoiceInteraction.speakText('Das'),
      () => device.movePantoTo(1, hotels[0]),
      () => DualPantoFramework.waitMS(500),
      () => VoiceInteraction.speakText('ist Hotel Adlon'),
      () => DualPantoFramework.waitMS(500),
      () => refollow()
    ]);
  }
  if (area === 'second_Hotel') {
    follow = false;
    DualPantoFramework.runScript([
      () => VoiceInteraction.speakText('Das'),
      () => device.movePantoTo(1, hotels[1]),
      () => DualPantoFramework.waitMS(500),
      () => VoiceInteraction.speakText('ist Hotel Air B&B'),
      () => DualPantoFramework.waitMS(500),
      () => refollow()
    ]);
  }
}

function refollow() {
  return new Promise((resolve) => {
    follow = true;
    resolve(resolve);
  });
}
