const DualPantoFramework = require('./dualpantoframework/Framework.js'),
      VoiceInteraction = DualPantoFramework.voiceInteraction;
      Vector = require('./dualpantoframework/Vector.js'),
      language = 'DE';
let device;
let follow = false;
let hotels = [new Vector(50, -50, 0), new Vector(75, -75, 0)];
let area = "start";

DualPantoFramework.on('devicesChanged', function(devices){
  for(const newdevice of devices){
    if(!device){
      device = newdevice
      start();
    }
  }
});

function inArea(position_me, position_hotel) {
    return  position_me.difference(position_hotel).length() <= 10;
}

function getArea(position) {
    let area = "";
    if (inArea(position, hotels[0])) {
        area = "first_Hotel"
    } else if (inArea(position, hotels[1])) {
        area = "second_Hotel"     
    } else {
        area = "start";
    }
    return area;
}

function start(){
  VoiceInteraction.setCommands(['Hotels']);
  device.on('handleMoved', function(index, position){
    if(follow && index == 0){
      if(!(getArea(position) === area)){
        area = getArea(position);
        nearbyLocation(area);
      }
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

function nearbyLocation(area){
  if(area === "first_Hotel"){
    follow = false;
    DualPantoFramework.run_script([
      () => VoiceInteraction.speakText('Das', language),
      () => device.movePantoTo(1, hotels[0]),
      () => DualPantoFramework.waitMS(500),
      () => VoiceInteraction.speakText('ist Hotel Adlon', language),
      () => DualPantoFramework.waitMS(500),
      () => refollow()
    ]);
  }
  if(area === "second_Hotel"){
    follow = false;
    DualPantoFramework.run_script([
      () => VoiceInteraction.speakText('Das', language),
      () => device.movePantoTo(1, hotels[1]),
      () => DualPantoFramework.waitMS(500),
      () => VoiceInteraction.speakText('ist Hotel Air B&B', language),
      () => DualPantoFramework.waitMS(500),
      () => refollow()
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