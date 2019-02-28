const DualPantoFramework = require('../..');
const VoiceInteraction = DualPantoFramework.voiceInteraction;
const {Vector} = DualPantoFramework;

let device;
let follow = false;
let activeObstacles = [];
const hotelnamesKreuzberg = ['Zur Post'];
const hotelnamesMitte = ['Krone', 'Zur Linde', 'Adlon'];
const hotelnamesTempelhof = ['Adler', 'Deutsches Haus'];
const apartmentnamesKreuzberg = ['Zwerg', 'Lindenblatt', 'Kottbusser Tor'];
const apartmentnamesMitte = ['Gold im Mund'];
const apartmentnamesTempelhof = ['Himmelsrausch', 'Luftbrücke'];

const let = []
apartments.push(new Apartment('Mitte', new Vector(-125, -45, NaN), 4500, 150, 3, false));
apartments.push(new Apartment('Mitte',  new Vector(-75, -75, NaN), 3000, 100, 3, true));
apartments.push(new Apartment('Mitte', new Vector(-100, -35, NaN), 1500, 30, 1, false));

apartments.push(new Apartment('Kreuzberg', new Vector(0, -50, NaN), 350, 72, 1, false));
apartments.push(new Apartment('Kreuzberg', new Vector(50, -75, NaN), 420, 120, 3, true));
apartments.push(new Apartment('Kreuzberg', new Vector(100, -250, NaN), 270, 30, 1, false));
apartments.push(new Apartment('Kreuzberg', new Vector(150, -80, NaN), 680, 220, 5, true));

apartments.push(new Apartment('Tempelhof', new Vector(-50, -120, NaN), 600, 680, 8, true));
apartments.push(new Apartment('Tempelhof', new Vector(0, -200 , NaN), 1200, 800, 6, true));
apartments.push(new Apartment('Tempelhof', new Vector(-75, -150, NaN), 500, 450, 4, true));
apartments.push(new Apartment('Tempelhof', new Vector(20, -200, NaN), 320, 100, 3, false));

let filter = {area: false, price: false, size: false, amountRooms: false, cellar: false};

class Apartment{
  constructor(area, cords=newVector(0,0,NaN), price=0, size=0, amountRooms=0, cellar=false){
    this.area = area
    this.cords = cords;
    this.price = price;
    this.size = size;
    this.amountRooms = amountRooms;
    this.cellar = cellar;
  }

  matchFilters(){
    let match = true;
    if(filter.price && this.price > maxprice){
      match = false;
    }
    if(filter.area && this.area === currentArea){
      match = false;
    }
    if(filter.size && this.size < minSize){
      match = false;
    }
    if(filter.amountRooms && this.amountRooms < minRooms){
      match = false;
    }
    if(filter.cellar && this.cellar != wantCeller){
      match = false;
    }
    return match;
  }
}

const startPosition = new Vector(-100, -100, NaN);
let area = 'Berlin';
let currentArea = 'Kreuzberg';

const mitteWalls = [[new Vector(-200, 0, NaN), new Vector(-200,-100)], [new Vector(-50, -100, NaN), new Vector(-200,-100)], [new Vector(-50, -100, NaN), new Vector(-50,0)]];
const kreuzbergWalls = [[new Vector(-50, -100, NaN), new Vector(-50,0)],
                       [new Vector(-50,-100, NaN), new Vector(-75, -100, NaN)],
                       [new Vector(-75, -100, NaN), new Vector(-75, -150, NaN)],
                       [new Vector(-75, -150, NaN), new Vector(0, -150, NaN)],
                       [new Vector(0, -150, NaN), new Vector(100,-400)]];
const tempelhofWalls = [[new Vector(0, -150, NaN), new Vector(100,-400)],
                       [new Vector(-75, -150, NaN), new Vector(0, -150, NaN)],
                       [new Vector(-75, -100, NaN), new Vector(-75, -150, NaN)],
                       [new Vector(-75, -100, NaN), new Vector(-200, -50, NaN)]];

const mittePoint = new Vector(-100, -50, NaN);
const kreuzbergPoint = new Vector(100, -200, NaN);
const tempelhofPoint = new Vector(0, -300, NaN);

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

const getArea = (position) => {
  follow = false;
  const lastArea = area;
  if(position.x > -50){
    if(position.x >= 0){
      if(position.y >= -3.25 * position.x -75){
        area = 'Kreuzberg';
      }
    }else{
      if(position.y >= -150){
        area = 'Kreuzberg';
      }else{
        area = 'Tempelhof';
      }
    }
  }else{
    if(position.y >= -100){
      area = 'Mitte';
    }else{
      if(position.y >= -150 && position.x >= -75){
        area = 'Kreuzberg';
      }else{
        area = 'Tempelhof';
      }
    }
  }
  if(area != lastArea){
    areaChange();
  }
  follow = true;
}

const poiNearby = (position) => {
  for(let i = 0; i<apartments.length; i++){
    if(apartments[i].matchFilters() && inArea(position, apartments[i].cords)){
      const hasCellar = apartments[i].cellar ? 'einen' : 'keinen';
      follow = false;
      DualPantoFramework.run_script([
        () => VoiceInteraction.speakText('Hier'),
        () => device.movePantoTo(1, apartments[i].cords),
        () => DualPantoFramework.waitMS(500),
        () => VoiceInteraction.speakText('ist eine Wohnung in deiner unmittelbaren Nähe'),
        () => DualPantoFramework.waitMS(500),
        () => VoiceInteraction.speakText('Die Wohnung Kostet ' + apartments[i].price + ' Euro im Monat.'),
        () => DualPantoFramework.waitMS(500),
        () => VoiceInteraction.speakText('Die Wohnung ist ' + apartments[i].size + ' Quadratmeter groß.'),
        () => DualPantoFramework.waitMS(500),
        () => VoiceInteraction.speakText('Die Wohnung hat ' + apartments[i].amountRooms + ' Räume.'),
        () => DualPantoFramework.waitMS(500),
        () => VoiceInteraction.speakText('Die Wohnung hat' + hasCellar + ' Keller.'),
        () => DualPantoFramework.waitMS(500)
        () => refollow()
      ]);
      return
    }
  }
}

const areaChange = () => {
  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText('Du bist jetzt in ' + area),
    () => DualPantoFramework.waitMS(500),
  ]);
}

const start = ()=> {
  VoiceInteraction.setCommands(['Wohnungen', 'Kreuzberg', 'Mitte', 'Tempelhof', 'Preis hoch', 'Preis runter', 'mehr Räume', 'weniger Räume', 'Keller ist notwendig', 'kein Keller', 'Größe anheben', 'Größe verringern', 'Preis ist egal', 'Größe ist egal', 'Keller ist egal', 'Anzahl der Räume ist egal']);
  device.on('handleMoved', function(index, position){
    if(follow && index == 0){
      getArea(position);
      poiNearby(position);
    }
  });

  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText('Willkommen zu Homefinder!'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Du bist aktuell hier, in Berlin.'),
    () => device.movePantoTo(0, startPosition),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Ich kann dir die Gegend Zeigen.'),
    () => device.movePantoTo(1, startPosition),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Wir haben hier drei Bezirke: Kreuzberg, Mitte und Tempelhof'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Nenne einen dieser Namen und ich kann dich zu diesem Bezirk bewegen.'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Wenn du Berlin sagst, kannst du dich wieder frei in der Stadt bewegen.'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Du kannst Orte sagen und ich zeige dir alle interessanten Orte für deine aktuelle Region'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Wenn du Hotels oder Wohnungen sagst, kannst du nach diesen Filtern'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Ich wünsche dir viel Spaß beim Erkunden von Berlin'),
    () => device.unblockHandle(0),
    () => refollow(),
    () => VoiceInteraction.beginListening()
  ]);

  let maxprice = 4500;
  let minRooms = 0;
  let wantCeller = true;
  let minSize = 0;
  //'Wohnungen', 'Kreuzberg', 'Mitte', 'Tempelhof', 'Preis hoch', 'Preis runter', 'mehr Räume', 'weniger Räume', 'Keller ist notwendig', 'kein Keller', 'Größe anheben', 'Größe verringern', 'Preis ist egal', 'Größe ist egal', 'Keller ist egal'
  VoiceInteraction.on('keywordRecognized', function(word){
    if(word === 'Preis hoch'){
      maxprice = maxprice + 100;
      VoiceInteraction.speakText('Der neue Maximal preis beträgt ' + maxprice + ' Euro im Monat.');
      filter.price = true;
    }
    if(word === 'Preis runter'){
      maxprice = maxprice - 100;
      VoiceInteraction.speakText('Der neue Maximal preis beträgt ' + maxprice + ' Euro im Monat.');
      filter.price = true;
    }
    if(word === 'Preis ist egal'){
      VoiceInteraction.speakText('Der Maximalpreis Filter wurde entfernt.');
      filter.price = false;
    }
    if(word === 'Wohnungen'){
      showAppartments();
    }
    if(word === 'mehr Räume'){
      minRooms = minRooms + 1;
      filter.amountRooms = true;
      VoiceInteraction.speakText('Die Mindestanzahl der Räume wurde auf ' + minRooms + ' festgelegt.');
    }
    if(word === 'weniger Räume'){
      minRooms = minRooms - 1;
      filter.amountRooms = true;
      VoiceInteraction.speakText('Die Mindestanzahl der Räume wurde auf ' + minRooms + ' festgelegt.');
    }
    if(word === 'Anzahl der Räume ist egal'){
      filter.amountRooms = false;
      VoiceInteraction.speakText('Der Räumefilter wurde entfernt.');
    }
    if(word === 'Keller ist notwendig'){
      VoiceInteraction.speakText('Es werden nur noch Wohnungen mit Keller gezeigt.');
      wantCeller = true;
      filter.cellar = false;
    }
    if(word === 'kein Keller'){
      VoiceInteraction.speakText('Es werden nur noch Wohnungen ohne Keller gezeigt.');
      wantCeller = false;
      filter.cellar = false;
    }
    if(word === 'Keller ist egal'){
      VoiceInteraction.speakText('Es werden Wohnungen unabhängig vom Keller gezeigt.');
      filter.cellar = false;
    }
    if(word === 'Größe anheben'){
      minSize = minSize + 25;
      VoiceInteraction.speakText('Die Mindestgröße wurde auf ' + minSize + ' Quadratmeter gesetzt.')
      filter.size = false;
    }
    if(word === 'Größe verringern'){
      minSize = minSize - 25;
      VoiceInteraction.speakText('Die Mindestgröße wurde auf ' + minSize + ' Quadratmeter gesetzt.')
      filter.size = false;
    }
    if(word === 'Größe ist egal'){
      VoiceInteraction.speakText('Der Mindestgrößenfilter wurde entfernt.')
      filter.size = false;
    }
    if(word === 'Berlin'){
      moveToBerlin();
    }
    if(word === 'Mitte'){
      moveToMitte();
    }
    if(word === 'Tempelhof'){
      moveToTempelhof();
    }
    if(word === 'Kreuzberg'){
      moveToKreuzberg();
    }
  });
}

const showAppartmens = ()=> {
  let script = [];
  let counter = 0;
  script.push('placeholder');
  script.push(() => DualPantoFramework.waitMS(500));
  if(currentArea === 'Berlin' || currentArea === 'Tempelhof'){
    counter = counter + apartmentsTempelhof.length;
    for(const apartment of apartmentsTempelhof){
      script.push(() => VoiceInteraction.speakText('Hier'));
      script.push(() => device.movePantoTo(1, apartment));
      script.push(() => DualPantoFramework.waitMS(500));
      script.push(() => VoiceInteraction.speakText('ist eine Wohnung'));
      script.push(() => DualPantoFramework.waitMS(500));
    }
  }
  if(currentArea === 'Berlin' || currentArea === 'Mitte'){
    counter = counter + apartmentsMitte.length;
    for(const apartment of apartmentsMitte){
      script.push(() => VoiceInteraction.speakText('Hier'));
      script.push(() => device.movePantoTo(1, apartment));
      script.push(() => DualPantoFramework.waitMS(500));
      script.push(() => VoiceInteraction.speakText('ist eine Wohnung'));
      script.push(() => DualPantoFramework.waitMS(500));
    }
  }
  if(currentArea === 'Berlin' || currentArea === 'Kreuzberg'){
    counter = counter + apartmentsKreuzberg.length;
    for(const apartment of apartmentsKreuzberg){
      script.push(() => VoiceInteraction.speakText('Hier'));
      script.push(() => device.movePantoTo(1, apartment));
      script.push(() => DualPantoFramework.waitMS(500));
      script.push(() => VoiceInteraction.speakText('ist eine Wohnung'));
      script.push(() => DualPantoFramework.waitMS(500));
    }
  }
  script[0] = () => VoiceInteraction.speakText('In deiner Gegend sind ' + counter + ' Wohnungen');
  DualPantoFramework.run_script(script);
}

const showPlaces = ()=> {
  let script = [];
  let counterHotels = 0;
  let counterAppartments = 0;
  script.push('placeholder');
  script.push(() => DualPantoFramework.waitMS(500));
  if(currentArea === 'Berlin' || currentArea === 'Tempelhof'){
    counterHotels = counterHotels + hotelsTempelhof.length;
    for(const hotel of hotelsTempelhof){
      script.push(() => VoiceInteraction.speakText('Hier'));
      script.push(() => device.movePantoTo(1, hotel));
      script.push(() => DualPantoFramework.waitMS(500));
      script.push(() => VoiceInteraction.speakText('ist ein Hotel'));
      script.push(() => DualPantoFramework.waitMS(500));
    }
  }
  if(currentArea === 'Berlin' || currentArea === 'Mitte'){
    counterHotels = counterHotels + hotelsMitte.length;
    for(const hotel of hotelsMitte){
      script.push(() => VoiceInteraction.speakText('Hier'));
      script.push(() => device.movePantoTo(1, hotel));
      script.push(() => DualPantoFramework.waitMS(500));
      script.push(() => VoiceInteraction.speakText('ist ein Hotel'));
      script.push(() => DualPantoFramework.waitMS(500));
    }
  }
  if(currentArea === 'Berlin' || currentArea === 'Kreuzberg'){
    counterHotels = counterHotels + hotelsKreuzberg.length;
    for(const hotel of hotelsKreuzberg){
      script.push(() => VoiceInteraction.speakText('Hier'));
      script.push(() => device.movePantoTo(1, hotel));
      script.push(() => DualPantoFramework.waitMS(500));
      script.push(() => VoiceInteraction.speakText('ist ein Hotel'));
      script.push(() => DualPantoFramework.waitMS(500));
    }
  }
  if(currentArea === 'Berlin' || currentArea === 'Tempelhof'){
    counterAppartments = counterAppartments + apartmentsTempelhof.length;
    for(const apartment of apartmentsTempelhof){
      script.push(() => VoiceInteraction.speakText('Hier'));
      script.push(() => device.movePantoTo(1, apartment));
      script.push(() => DualPantoFramework.waitMS(500));
      script.push(() => VoiceInteraction.speakText('ist eine Wohnung'));
      script.push(() => DualPantoFramework.waitMS(500));
    }
  }
  if(currentArea === 'Berlin' || currentArea === 'Mitte'){
    counterAppartments = counterAppartments + apartmentsMitte.length;
    for(const apartment of apartmentsMitte){
      script.push(() => VoiceInteraction.speakText('Hier'));
      script.push(() => device.movePantoTo(1, apartment));
      script.push(() => DualPantoFramework.waitMS(500));
      script.push(() => VoiceInteraction.speakText('ist eine Wohnung'));
      script.push(() => DualPantoFramework.waitMS(500));
    }
  }
  if(currentArea === 'Berlin' || currentArea === 'Kreuzberg'){
    counterAppartments = counterAppartments + apartmentsKreuzberg.length;
    for(const apartment of apartmentsKreuzberg){
      script.push(() => VoiceInteraction.speakText('Hier'));
      script.push(() => device.movePantoTo(1, apartment));
      script.push(() => DualPantoFramework.waitMS(500));
      script.push(() => VoiceInteraction.speakText('ist eine Wohnung'));
      script.push(() => DualPantoFramework.waitMS(500));
    }
  }
  script[0] = () => VoiceInteraction.speakText('In deiner Gegend sind ' + counterHotels + ' Hotels und '+ counterAppartments + ' Wohnungen');
  DualPantoFramework.run_script(script);
}

const moveToKreuzberg = ()=> {
  follow = false;
  for(const obs of activeObstacles){
    device.removeObstacle(obs, 0);
  }
  device.movePantoTo(0, kreuzbergPoint);
  setTimeout(() =>{
    let temp = [];
    for(const wall of kreuzbergWalls){
      temp.push(device.createObstacle(wall, 0));
    }
    activeObstacles = temp
    currentArea = 'Kreuzberg';
    area = 'Kreuzberg';
    DualPantoFramework.run_script([
      () => VoiceInteraction.speakText('Du bist jetzt in Kreuzberg'),
      () => DualPantoFramework.waitMS(1000),
      () => refollow(),
      () => device.unblockHandle(0)
    ]);
  }, 1000);
}

const moveToTempelhof = ()=> {
  follow = false;
  for(const obs of activeObstacles){
    device.removeObstacle(obs, 0);
  }
  device.movePantoTo(0, tempelhofPoint);
  setTimeout(() =>{
    let temp = [];
    for(const wall of tempelhofWalls){
      temp.push(device.createObstacle(wall, 0));
    }
    activeObstacles = temp
    currentArea = 'Tempelhof';
    area = 'Tempelhof';
    DualPantoFramework.run_script([
      () => VoiceInteraction.speakText('Du bist jetzt in Tempelhof'),
      () => DualPantoFramework.waitMS(1000),
      () => refollow(),
      () => device.unblockHandle(0)
    ]);
  }, 1000);
}

const moveToMitte = ()=> {
  follow = false;
  for(const obs of activeObstacles){
    device.removeObstacle(obs, 0);
  }
  device.movePantoTo(0, mittePoint);
  setTimeout(() =>{
    let temp = [];
    for(const wall of mitteWalls){
      temp.push(device.createObstacle(wall, 0));
    }
    activeObstacles = temp
    currentArea = 'Mitte';
    area = 'Mitte';
    DualPantoFramework.run_script([
      () => VoiceInteraction.speakText('Du bist jetzt in Mitte'),
      () => DualPantoFramework.waitMS(1000),
      () => refollow(),
      () => device.unblockHandle(0)
    ]);
  }, 1000);
}

const moveToBerlin = ()=> {
  for(const obs of activeObstacles){
    device.removeObstacle(obs, 0);
  }
  activeObstacles = [];
  currentArea = 'Berlin';
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
