const DualPantoFramework = require('./dualpantoframework/Framework.js'),
      VoiceInteraction = DualPantoFramework.voiceInteraction;
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
  VoiceInteraction.setCommands(['Hotels']);
  device.on('handleMoved', function(index, position){
    if(follow && index == 0){
      nearbyLocation(position);
    }
  });

  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText('Willkommen zu Homefinder', language),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Sie sind aktuell hier.', language),
    () => device.movePantoTo(0,new Vector(-50, -75, 0)),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Berlin ist so groß.', language),
    () => device.movePantoTo(1,new Vector(-50, -75, 0)),
    //TODO: here display a square around the field
  
    () => VoiceInteraction.speakText('Du kannst Hotels sagen und ich zeige dir Hotelstandorte.', language),
    () => DualPantoFramework.waitMS(500),
    () => device.unblockHandle(0),
    () => refollow(),
    () => VoiceInteraction.beginListening()
  ]);

  VoiceInteraction.on('keywordRecognized', function(word){
    if(word === 'Hotels'){
      showHotels();
    }
  });
}


function showHotels(){
    DualPantoFramework.run_script([
    () => VoiceInteraction.speakText('Das', language),
    () => device.movePantoTo(1, new Vector(50, -50, 0)),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('ist Hotel Adlon', language),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Das', language),
    () => device.movePantoTo(1, new Vector(50, -75, 0)),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('ist Hotel Air B&B', language),
    () => DualPantoFramework.waitMS(500)
  ]);
}

function nearbyLocation(position){
  let dif1 = position.difference(new Vector(50, -50, 0)).length();
  let dif2 = position.difference(new Vector(50, -75, 0)).length();
  if(dif1 <= 10){
    follow = false;
    DualPantoFramework.run_script([
      () => VoiceInteraction.speakText('Das', language),
      () => device.movePantoTo(1, new Vector(50, -50, 0)),
      () => DualPantoFramework.waitMS(500),
      () => VoiceInteraction.speakText('ist Hotel Adlon', language),
      () => DualPantoFramework.waitMS(500),
    ]);
  }
  if(dif2 <= 10){
    follow = false;
    DualPantoFramework.run_script([
      () => VoiceInteraction.speakText('Das', language),
      () => device.movePantoTo(1, new Vector(50, -75, 0)),
      () => DualPantoFramework.waitMS(500),
      () => VoiceInteraction.speakText('ist Hotel Air B&B', language),
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