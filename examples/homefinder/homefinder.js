const PantoConnector = require('./dualpantoframework/Framework.js'),
      Vector = require('./dualpantoframework/Vector.js'),
      language = 'DE';
let connector;
let follow = false;

PantoConnector.on('devicesChanged', function(devices){
  for(const device of devices){
    if(!connector){
      connector = device
      start();
    }
  }
});


function start(){  
  PantoConnector.run_script([
    () => PantoConnector.speakText('Willkommen zu Homfinder', language),
    () => PantoConnector.waitMS(500),
    () => PantoConnector.speakText('Sie sind hier.', language),
    () => connector.movePantoTo(0,new Vector(-100, -150, 0)),
    () => PantoConnector.waitMS(500),
    () => connector.movePantoTo(1,new Vector(-100, -150, 0)),
    () => PantoConnector.waitMS(500),

    () => PantoConnector.speakText('Das', language),
    () => connector.movePantoTo(1, new Vector(-100, -100, 0)),
    () => PantoConnector.waitMS(500),
    () => PantoConnector.speakText('ist Berlin Hauptbahnhof', language),
    () => PantoConnector.waitMS(500),
    () => PantoConnector.speakText('Du kannst Hotels sagen und ich zeige dir Hotelstandtorte.', language),
    () => PantoConnector.waitMS(500),
    () => connector.unblockHandle(0),
    () => refollow(),
    () => PantoConnector.beginListening()
  ]);
  PantoConnector.setCommands(['Hotels']);
  connector.on('handleMoved', function(index, position){
    if(follow && index == 0){
      nearbyLocation(position);
    }
  });

  PantoConnector.on('keywordRecognized', function(word){
    console.log(word);
    if(word === 'Hotels'){
      showHotels();
    }
  });
}


function showHotels(){
    PantoConnector.run_script([
    () => PantoConnector.speakText('Das', language),
    () => connector.movePantoTo(1, new Vector(100, -100, 0)),
    () => PantoConnector.waitMS(500),
    () => PantoConnector.speakText('ist Hotel Adlon', language),
    () => PantoConnector.waitMS(500),
    () => PantoConnector.speakText('Das', language),
    () => connector.movePantoTo(1, new Vector(100, -150, 0)),
    () => PantoConnector.waitMS(500),
    () => PantoConnector.speakText('ist Hotel Air B&B', language),
    () => PantoConnector.waitMS(500)
  ]);
}

function nearbyLocation(position){
  let dif1 = position.difference(new Vector(100, -100, 0)).length();
  let dif2 = position.difference(new Vector(100, -150, 0)).length();
  if(dif1 <= 10){
    follow = false;
    PantoConnector.run_script([
      () => PantoConnector.speakText('Das', language),
      () => connector.movePantoTo(1, new Vector(100, -100, 0)),
      () => PantoConnector.waitMS(500),
      () => PantoConnector.speakText('ist Hotel Adlon', language),
      () => PantoConnector.waitMS(500),
    ]);
  }
  if(dif2 <= 10){
    follow = false;
    PantoConnector.run_script([
      () => PantoConnector.speakText('Das', language),
      () => connector.movePantoTo(1, new Vector(100, -150, 0)),
      () => PantoConnector.waitMS(500),
      () => PantoConnector.speakText('ist Hotel Air B&B', language),
      () => PantoConnector.waitMS(500)
    ]);
  }
}

function refollow(){
  return new Promise (resolve => 
    {
        follow = true;
        resolve(resolve);
    });
}