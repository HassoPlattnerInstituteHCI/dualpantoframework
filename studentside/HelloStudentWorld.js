const PantoConnector = require('./dualpantoframework/Framework.js'),
      Vector = require('./dualpantoframework/Vector.js');

PantoConnector.on('devicesChanged', function(devices){
  for(const device of devices){
    start(device);
  }
});

function start(connector){
  console.log('hello world')
  connector.run_script([
    () => connector.speakText('Hallo!'),
    () => connector.waitMS(500),
    () => connector.speakText('Sie sind hier.'),
    () => connector.movePantoTo(0,new Vector(-100, -150, 0), 500),
    () => connector.waitMS(500),
    () => connector.speakText('Ich zeige dir ein paar Punkte.'),
    () => connector.movePantoTo(1,new Vector(-100, -150, 0), 500),
    () => connector.waitMS(500),

    () => connector.speakText('Das'),
    () => connector.movePantoTo(1, new Vector(-100, -100, 0), 500),
    () => connector.waitMS(500),
    () => connector.speakText('ist der erste Punkt.'),
    () => connector.waitMS(500),
    () => connector.speakText('Interessanter Fakt über diesen Punkt.'),
    () => connector.waitMS(500),

    () => connector.speakText('Das'),
    () => connector.movePantoTo(1, new Vector(-150, -100, 0), 500),
    () => connector.waitMS(500),
    () => connector.speakText('ist der zweite Punkt.'),
    () => connector.waitMS(500),
    () => connector.speakText('Interessanter Fakt über diesen Punkt.'),
    () => connector.waitMS(500),

    () => connector.speakText('Das'),
    () => connector.movePantoTo(1, new Vector(0, -100, 0), 500),
    () => connector.waitMS(500),
    () => connector.speakText('ist der dritte Punkt.'),
    () => connector.waitMS(500),
    () => connector.speakText('Interessanter Fakt über diesen Punkt.'),
    () => connector.waitMS(500),
    () => connector.unblockHandle(0)
  ]);
}