const DualPantoFramework = require('./dualpantoframework/Framework.js'),
      Vector = require('./dualpantoframework/Vector.js'),
      language = 'DE';
let device;
let follow = false;

DualPantoFramework.on('devicesChanged', function(devices){
  for(const newdevice of devices){
    if(!device){
      device = newdevice
      start();
    }
  }
});


function start(){  
  DualPantoFramework.run_script([
    () => DualPantoFramework.speakText('Willkommen zu Homfinder', language),
    () => DualPantoFramework.waitMS(500),
    () => DualPantoFramework.speakText('Sie sind aktuell hier.', language),
    () => device.movePantoTo(0,new Vector(-100, -150, 0)),
    () => DualPantoFramework.waitMS(500),
    () => DualPantoFramework.speakText('Berlin ist so große.', language),
    () => device.movePantoTo(1,new Vector(-100, -150, 0)),
    //TODO: here display a square around the field
  
    () => DualPantoFramework.speakText('Du kannst Hotels sagen und ich zeige dir Hotelstandtorte.', language),
    () => DualPantoFramework.waitMS(500),
    () => device.unblockHandle(0),
    () => refollow(),
    () => DualPantoFramework.beginListening()
  ]);
  
  DualPantoFramework.setCommands(['Hotels']);
  device.on('handleMoved', function(index, position){
    if(follow && index == 0){
      nearbyLocation(position);
    }
  });

  DualPantoFramework.on('keywordRecognized', function(word){
    console.log(word);
    if(word === 'Hotels'){
      showHotels();
    }
  });
}


function showHotels(){
    DualPantoFramework.run_script([
    () => DualPantoFramework.speakText('Das', language),
    () => device.movePantoTo(1, new Vector(100, -100, 0)),
    () => DualPantoFramework.waitMS(500),
    () => DualPantoFramework.speakText('ist Hotel Adlon', language),
    () => DualPantoFramework.waitMS(500),
    () => DualPantoFramework.speakText('Das', language),
    () => device.movePantoTo(1, new Vector(100, -150, 0)),
    () => DualPantoFramework.waitMS(500),
    () => DualPantoFramework.speakText('ist Hotel Air B&B', language),
    () => DualPantoFramework.waitMS(500)
  ]);
}

function nearbyLocation(position){
  let dif1 = position.difference(new Vector(100, -100, 0)).length();
  let dif2 = position.difference(new Vector(100, -150, 0)).length();
  if(dif1 <= 10){
    follow = false;
    DualPantoFramework.run_script([
      () => DualPantoFramework.speakText('Das', language),
      () => device.movePantoTo(1, new Vector(100, -100, 0)),
      () => DualPantoFramework.waitMS(500),
      () => DualPantoFramework.speakText('ist Hotel Adlon', language),
      () => DualPantoFramework.waitMS(500),
    ]);
  }
  if(dif2 <= 10){
    follow = false;
    DualPantoFramework.run_script([
      () => DualPantoFramework.speakText('Das', language),
      () => device.movePantoTo(1, new Vector(100, -150, 0)),
      () => DualPantoFramework.waitMS(500),
      () => DualPantoFramework.speakText('ist Hotel Air B&B', language),
      () => DualPantoFramework.waitMS(500)
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