const PantoConnector = require('./dualpantoframework/Framework.js'),
      Vector = require('./dualpantoframework/Vector.js');

PantoConnector.on('devicesChanged', function(devices){
  for(const device of devices){
    start(device);
  }
});


function start(connector){
  connector.addKeyPhrase("Zeige mir Hotels", showHotels);  
  connector.run_script([
    () => connector.speakText('Willkommen zu Homfinder'),
    () => connector.waitMS(500),
    () => connector.speakText('Sie sind hier.'),
    () => connector.moveHandleTo(0,new Vector(-100, -150, 0)),
    () => connector.waitMS(500),
    () => connector.moveHandleTo(1,new Vector(-100, -150, 0)),
    () => connector.waitMS(500),

    () => connector.speakText('Das'),
    () => connector.moveHandleTo(1, new Vector(-100, -100, 0)),
    () => connector.waitMS(500),
    () => connector.speakText('ist Berlin Hauptbahnhof'),
    () => connector.waitMS(500),
    () => connector.speakText('Du kannst Zeige mir Hotels sagen und ich zeige dir Hotelstandtorte.'),
    () => connector.waitMS(500),
    () => connector.unblockHandle(0)
  ]);
  connector.on('handleMoved', function(index, position){
    if(index == 0){
      nearbyLocation(position);
    }
  });

}

function showHotels(){
    connector.run_script([
    () => connector.speakText('Das'),
    () => connector.moveHandleTo(1, new Vector(100, -100, 0)),
    () => connector.waitMS(500),
    () => connector.speakText('ist Hotel Adlon'),
    () => connector.waitMS(500),
    () => connector.speakText('Das'),
    () => connector.moveHandleTo(1, new Vector(100, -150, 0)),
    () => connector.waitMS(500),
    () => connector.speakText('ist Hotel Air B&B'),
    () => connector.waitMS(500)
  ]);
}

function nearbyLocation(position){
  if(position.difference(new Vector(100, -100, 0)).length() <= 10){
    connector.run_script([
      () => connector.speakText('Das'),
      () => connector.moveHandleTo(1, new Vector(100, -100, 0)),
      () => connector.waitMS(500),
      () => connector.speakText('ist Hotel Adlon'),
      () => connector.waitMS(500),
    ]);
  }
  if(position.difference(new Vector(100, -150, 0)).length() <= 10){
    connector.run_script([
      () => connector.speakText('Das'),
      () => connector.moveHandleTo(1, new Vector(100, -150, 0)),
      () => connector.waitMS(500),
      () => connector.speakText('ist Hotel Air B&B'),
      () => connector.waitMS(500)
    ]);
  }
}