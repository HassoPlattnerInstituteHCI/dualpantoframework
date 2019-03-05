const DualPantoFramework = require('../..');
const VoiceInteraction = DualPantoFramework.voiceInteraction;
const {Vector} = DualPantoFramework;

let device;
let follow = false;
const hotels = [new Vector(125, -100, NaN), new Vector(150, -125, NaN)];
const startPosition = new Vector(-100, -100, NaN);
let area = "start";
const upperRiver = [new Vector(-10, -25, NaN), new Vector(10, -25, NaN), new Vector(10, -75, NaN), new Vector(-10, -75, NaN)];
const bridge = [new Vector(-10, -75, NaN), new Vector(10, -75, NaN), new Vector(10, -85, NaN), new Vector(-10, -85, NaN)];
const lowerRiver = [new Vector(-10, -85, NaN), new Vector(10, -85, NaN), new Vector(10, -200, NaN), new Vector(-10, -200, NaN)];

DualPantoFramework.on('devicesChanged', function(devices){
  for(const newdevice of devices){
    if(!device){
      device = newdevice
      start();
    }
  }
});

const inArea = (position_me, position_hotel)=> {
    return  position_me.difference(position_hotel).length() <= 10;
}

const getArea = (position)=> {
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

const start = ()=> {
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
    () => VoiceInteraction.speakText('Willkommen zu Homefinder!'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Sie sind aktuell hier.'),
    () => device.movePantoTo(0, startPosition),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Lass mich dir die Gegend zeigen.'),
    () => device.movePantoTo(1, startPosition),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Ein Fluss fließt durch diese Gegend.'),
    () => promiseObstacles(upperRiver, 0),
    () => promiseObstacles(lowerRiver, 0),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Du findest ihn hier.'),
    () => device.movePantoTo(1, upperRiver[0]),
    () => DualPantoFramework.waitMS(500),
    () => device.movePantoTo(1, upperRiver[1], 60),
    () => DualPantoFramework.waitMS(1000),
    () => device.movePantoTo(1, lowerRiver[2], 60),
    () => DualPantoFramework.waitMS(2000),
    () => device.movePantoTo(1, lowerRiver[3], 60),
    () => DualPantoFramework.waitMS(1000),
    () => device.movePantoTo(1, upperRiver[0], 60),
    () => DualPantoFramework.waitMS(2000),
    () => VoiceInteraction.speakText('Es gibt eine Brücke, die über den Fluss führt.'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Hier kannst du den Fluss dank der Brücke überqueren.'),
    () => device.movePantoTo(1, bridge[0]),
    () => DualPantoFramework.waitMS(500),
    () => device.movePantoTo(1, bridge[1], 60),
    () => DualPantoFramework.waitMS(1000),
    () => device.movePantoTo(1, bridge[2], 60),
    () => DualPantoFramework.waitMS(2000),
    () => device.movePantoTo(1, bridge[3], 60),
    () => DualPantoFramework.waitMS(1000),
    () => device.movePantoTo(1, bridge[0], 60),
    () => DualPantoFramework.waitMS(2000),
    () => VoiceInteraction.speakText('Du kannst Hotels sagen und ich zeige dir Hotelstandorte.'),
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


const showHotels = ()=> {
    DualPantoFramework.run_script([
    () => VoiceInteraction.speakText('Das'),
    () => device.movePantoTo(1, hotels[0]),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('ist Hotel Adlon'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Das'),
    () => device.movePantoTo(1, hotels[1]),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('ist Hotel Air B&B'),
    () => DualPantoFramework.waitMS(500)
  ]);
}

const nearbyLocation = (area)=> {
  if(area === "first_Hotel"){
    follow = false;
    DualPantoFramework.run_script([
      () => VoiceInteraction.speakText('Das'),
      () => device.movePantoTo(1, hotels[0]),
      () => DualPantoFramework.waitMS(500),
      () => VoiceInteraction.speakText('ist Hotel Adlon'),
      () => DualPantoFramework.waitMS(500),
      () => refollow()
    ]);
  }
  if(area === "second_Hotel"){
    follow = false;
    DualPantoFramework.run_script([
      () => VoiceInteraction.speakText('Das'),
      () => device.movePantoTo(1, hotels[1]),
      () => DualPantoFramework.waitMS(500),
      () => VoiceInteraction.speakText('ist Hotel Air B&B'),
      () => DualPantoFramework.waitMS(500),
      () => refollow()
    ]);
  }
}

const refollow = ()=>{
  return new Promise (resolve => {
    follow = true;
    resolve(resolve);
  });
}

const promiseObstacles = (pointArray, index=-1)=>{
  return new Promise (resolve => {
    device.createObstacle(pointArray, index);
    resolve(resolve);
  });
}
