const usbport = '/dev/cu.usbmodem1421',
      PantoConnector = require('./dualpantoframework/Framework.js'),
      Vector = require('./dualpantoframework/Vector.js');

connector = new PantoConnector(usbport);
connector.run_script([
  () => connector.speakText('Hello'),
  () => connector.waitMS(500),
  () => connector.speakText('You are here'),
  () => connector.movePantoTo(0,new Vector(-100, -200, 0), 500),
  () => connector.waitMS(500),
  () => connector.speakText('Let me show you points'),
  () => connector.movePantoTo(1,new Vector(-100, -200, 0), 500),
  () => connector.waitMS(500),

  () => connector.speakText('this'),
  () => connector.movePantoTo(1, new Vector(-100, -100, 0), 500),
  () => connector.waitMS(500),
  () => connector.speakText('is the first point'),
  () => connector.waitMS(500),
  () => connector.speakText('I could tell you interesting facts about this point'),
  () => connector.waitMS(500),

  () => connector.speakText('this'),
  () => connector.movePantoTo(1, new Vector(-200, -100, 0), 500),
  () => connector.waitMS(500),
  () => connector.speakText('is the second point'),
  () => connector.waitMS(500),
  () => connector.speakText('I could tell you interesting facts about this point'),
  () => connector.waitMS(500),

  () => connector.speakText('this'),
  () => connector.movePantoTo(1, new Vector(0, -100, 0), 500),
  () => connector.waitMS(500),
  () => connector.speakText('is the third point'),
  () => connector.waitMS(500),
  () => connector.speakText('I could tell you interesting facts about this point'),
  () => connector.waitMS(500),
]);
