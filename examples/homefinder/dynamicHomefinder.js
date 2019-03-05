const DualPantoFramework = require('../..');
const VoiceInteraction = DualPantoFramework.voiceInteraction;
const {Vector} = DualPantoFramework;

let device;
let follow = false;
let activeObstacles = [];
let stop = false;
let filterActive = false;
let maxprice = 4500;
let firstTimefiler = true;
const s1 = [{name: 'Yorkstraße', point: new Vector(-150, -300, NaN)}, {name: 'Anhalter Bahnhof', point: new Vector(-60, -150, NaN)}, {name: 'Potsdamer Platz', point: new Vector(-50, -90, NaN)}, {name: 'Brandenburger Tor', point: new Vector(-70, -75, NaN)}, {name: 'Friedrichstraße', point: new Vector(-50, -50, NaN)}];
const s7 = [{name: 'Bellevue', point: new Vector(-180, -100, NaN)}, {name: 'Berliner Hauptbahnhof', point: new Vector(-100, -35, NaN)}, {name: 'Friedrichstraße', point: new Vector(-50, -50, NaN)}, {name: 'Hackescher Markt', point: new Vector(-25, -50, NaN)}, {name: 'Alexanderplatz', point: new Vector(0, -75, NaN)},  {name: 'Jannowitzbrücke', point: new Vector(40, -100, NaN)}, {name: 'Ostbahnhof', point: new Vector(100, -120, NaN)}]

let filter = {area: false, price: false, size: false, amountRooms: false, cellar: false};

const startPosition = new Vector(0, -75, NaN);
let area = 'Mitte';
let currentArea = 'Mitte';

const mitteWalls = [[new Vector(-200, 0, NaN), new Vector(-200,-100, NaN)], [new Vector(-200,-100, NaN), new Vector(50, -100, NaN)], [new Vector(50, -100, NaN), new Vector(50, 0, NaN)]];
const kreuzbergWalls = [[new Vector(50, -100, NaN), new Vector(50,0, NaN)],
                       [new Vector(50, -100, NaN), new Vector(-75, -100, NaN)],
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

let minRooms = 0;
let wantCeller = true;
let minSize = 0;

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

const apartments = []
apartments.push(new Apartment('Mitte', new Vector(-125, -45, NaN), 4500, 150, 3, false));
apartments.push(new Apartment('Mitte',  new Vector(-75, -75, NaN), 3000, 100, 3, true));
apartments.push(new Apartment('Mitte', new Vector(-100, -35, NaN), 1500, 30, 1, false));

apartments.push(new Apartment('Kreuzberg', new Vector(60, -50, NaN), 350, 72, 1, false));
apartments.push(new Apartment('Kreuzberg', new Vector(70, -75, NaN), 420, 120, 3, true));
apartments.push(new Apartment('Kreuzberg', new Vector(100, -250, NaN), 270, 30, 1, false));
apartments.push(new Apartment('Kreuzberg', new Vector(150, -80, NaN), 680, 220, 5, true));

apartments.push(new Apartment('Tempelhof', new Vector(-50, -120, NaN), 600, 680, 8, true));
apartments.push(new Apartment('Tempelhof', new Vector(0, -200 , NaN), 1200, 800, 6, true));
apartments.push(new Apartment('Tempelhof', new Vector(-75, -150, NaN), 500, 450, 4, true));
apartments.push(new Apartment('Tempelhof', new Vector(20, -200, NaN), 320, 100, 3, false));

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
  if(position.x > 50){
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
      follow = false;
      const hasCellar = apartments[i].cellar ? 'a' : 'no';
      DualPantoFramework.run_script([
        () => stop ? nothing() : VoiceInteraction.speakText('Here', 'EN'),
        () => stop ? nothing() : device.movePantoTo(1, apartments[i].cords),
        () => stop ? nothing() : DualPantoFramework.waitMS(500),
        () => stop ? nothing() : VoiceInteraction.speakText('is an apartment', 'EN'),
        () => stop ? nothing() : DualPantoFramework.waitMS(500),
        () => stop ? nothing() : VoiceInteraction.speakText('The rent is ' + apartments[i].price + ' Euro per month.', 'EN'),
        () => stop ? nothing() : DualPantoFramework.waitMS(500),
        () => stop ? nothing() : VoiceInteraction.speakText('It is ' + apartments[i].size + ' squaremeter big,', 'EN'),
        () => stop ? nothing() : DualPantoFramework.waitMS(500),
        () => stop ? nothing() : VoiceInteraction.speakText('has ' + apartments[i].amountRooms + ' rooms and ', 'EN'),
        () => stop ? nothing() : DualPantoFramework.waitMS(500),
        () => stop ? nothing() : VoiceInteraction.speakText('has' + hasCellar + ' celler.', 'EN'),
        () => stop ? nothing() : DualPantoFramework.waitMS(500),
        () => refollow(),
        () => resume()
      ]);
      return
    }
  }
}

const areaChange = () => {
  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText('you are in ', 'EN'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText(area),
    () => DualPantoFramework.waitMS(50)
  ]);
}

const start = ()=> {
  VoiceInteraction.setCommands(['Wohnungen', 'Kreuzberg', 'Mitte', 'Tempelhof', 'Berlin','Preis hoch', 'Preis runter', 'mehr Räume', 'weniger Räume', 'Keller ist notwendig', 'kein Keller', 'Größe anheben', 'Größe verringern', 'Preis ist egal', 'Größe ist egal', 'Keller ist egal', 'Anzahl der Räume ist egal', 'Hilfe', 'Filter', 'Stop', 'stop', 'fertig', 'Wo bin ich', 'halt', 'abbrechen', 'Abbruch']);
  device.on('handleMoved', function(index, position){
    if(follow && index == 0){
      getArea(position);
      poiNearby(position);
    }
  });

  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText('You are here', 'EN'),
    () => device.movePantoTo(0, startPosition),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('at Berlin Alexanderplatz', 'EN'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('that is in Mitte', 'EN'),
    () => showMitte(),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('Commands: apartments, where am I, search criteria, help', 'EN'),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText('You can also walk around and find apartments by your own', 'EN'),
    () => device.unblockHandle(0),
    () => refollow(),
    () => VoiceInteraction.beginListening()
  ]);

  //'Wohnungen', 'Kreuzberg', 'Mitte', 'Tempelhof', 'Preis hoch', 'Preis runter', 'mehr Räume', 'weniger Räume', 'Keller ist notwendig', 'kein Keller', 'Größe anheben', 'Größe verringern', 'Preis ist egal', 'Größe ist egal', 'Keller ist egal'
  VoiceInteraction.on('keywordRecognized', function(word){
    if(filterActive && word === 'Preis hoch'){
      if(maxprice + 100 > 1000){
        maxprice = maxprice + 1000;
      }else{
        maxprice = maxprice + 100;
      }
      VoiceInteraction.speakText('Der neue Maximal preis beträgt ' + maxprice + ' Euro im Monat.');
      filter.price = true;
    }
    if(filterActive && word === 'Preis runter'){
      if(maxprice - 1000 < 1000){
        maxprice = maxprice - 100;
      }else{
        maxprice = maxprice - 1000;
      }
      if(maxprice < 0){
        maxprice = 0;
      }
      VoiceInteraction.speakText('Der neue Maximal preis beträgt ' + maxprice + ' Euro im Monat.');
      filter.price = true;
    }
    if(filterActive && word === 'Preis ist egal'){
      VoiceInteraction.speakText('Der Maximalpreis Filter wurde entfernt.');
      filter.price = false;
    }
    if(word === 'Wohnungen'){
      showApartments();
    }
    if(filterActive && word === 'mehr Räume'){
      minRooms = minRooms + 1;
      filter.amountRooms = true;
      VoiceInteraction.speakText('Die Mindestanzahl der Räume wurde auf ' + minRooms + ' festgelegt.');
    }
    if(filterActive && word === 'weniger Räume'){
      minRooms = minRooms - 1;
      filter.amountRooms = true;
      VoiceInteraction.speakText('Die Mindestanzahl der Räume wurde auf ' + minRooms + ' festgelegt.');
    }
    if(filterActive && word === 'Anzahl der Räume ist egal'){
      filter.amountRooms = false;
      VoiceInteraction.speakText('Der Räumefilter wurde entfernt.');
    }
    if(filterActive && word === 'Keller ist notwendig'){
      VoiceInteraction.speakText('Es werden nur noch Wohnungen mit Keller gezeigt.');
      wantCeller = true;
      filter.cellar = false;
    }
    if(filterActive && word === 'kein Keller'){
      VoiceInteraction.speakText('Es werden nur noch Wohnungen ohne Keller gezeigt.');
      wantCeller = false;
      filter.cellar = false;
    }
    if(filterActive && word === 'Keller ist egal'){
      VoiceInteraction.speakText('Es werden Wohnungen unabhängig vom Keller gezeigt.');
      filter.cellar = false;
    }
    if(filterActive && word === 'Größe anheben'){
      minSize = minSize + 25;
      VoiceInteraction.speakText('Die Mindestgröße wurde auf ' + minSize + ' Quadratmeter gesetzt.')
      filter.size = false;
    }
    if(filterActive && word === 'Größe verringern'){
      minSize = minSize - 25;
      VoiceInteraction.speakText('Die Mindestgröße wurde auf ' + minSize + ' Quadratmeter gesetzt.')
      filter.size = false;
    }
    if(filterActive && word === 'Größe ist egal'){
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
    if(word === 'Hilfe'){
      if(filterActive){
        firstTimefiler = true;
        initFilter();
      }else{
        help();
      }
    }
    if(word === 'Filter'){
      initFilter();
    }
    if(word === 'Stop' || word === 'stop' || word === 'halt' || word === 'abbrechen' || word === 'Abbruch'){
      stop = true;
    }
    if(filterActive && word === 'fertig'){
      closeFilter();
    }
    if(word === 'Wo bin ich'){
      follow = false;
      locationhelp();
    }
  });
}

const locationhelp = () => {
  let temp = [];
  temp.push(() => stop ? nothing() : VoiceInteraction.speakText('Hier'));
  temp.push(() => stop ? nothing() : device.movePantoTo(1, startPosition));
  temp.push(() => stop ? nothing() : VoiceInteraction.speakText('Ist der Alexanderplatz'));
  temp.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
  temp.push(() => stop ? nothing() : VoiceInteraction.speakText('Die S sieben fährt hier lang'));
  temp.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
  for(const station of s7){
    temp.push(() => stop ? nothing() : device.movePantoTo(1, station.point));
    temp.push(() => stop ? nothing() : VoiceInteraction.speakText(station.name));
    temp.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
  }
  temp.push(() => stop ? nothing() : VoiceInteraction.speakText('Die S eins fährt hier lang'));
  temp.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
  for(const station of s1){
    temp.push(() => stop ? nothing() : device.movePantoTo(1, station.point));
    temp.push(() => stop ? nothing() : VoiceInteraction.speakText(station.name));
    temp.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
  }
  temp.push(() => refollow());
  temp.push(() => resume());
  DualPantoFramework.run_script(temp);
}

const initFilter = () =>{
  filterActive = true;
  DualPantoFramework.run_script([
    () => stop ? nothing() : VoiceInteraction.speakText('Filtermenü. Sage fertig um das Menü zu verlassen'),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Es gibt verschiedene Filter: Preis, Anzahl der Räume, Keller vorhanden undGröße'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Um den Preisfilter zu aktivieren musst du einen Maximalpreis setzen.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Mit dem Kommando Preis hoch oder Preis runter, kannst du den Preisfilter aktivieren und gleichzeitig den Preis anpassen.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Möchtest du den Preisfilter deaktivieren, sage Preis ist egal.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Um den Raumfilter zu aktivieren musst du einen Mindestanzahl an Räumen setzen.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Mit dem Kommando mehr Räume oder weniger Räume, kannst du den Raumfilter aktivieren und gleichzeitig die Mindestanzahl an Räumen anpassen.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Möchtest du den Raumfilter deaktivieren, sage Anzahl der Räume ist egal.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Um den Kellerfilter zu aktivieren musst du angeben, ob du einen Keller möchtest oder nicht.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Mit dem Kommando Keller ist notwendig oder kein Keller, setzt du deine Präferenz und aktivierst den Keller.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Möchtest du den Kellerfilter deaktivieren, sage Keller ist egal.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Um den Größenfilter zu aktivieren musst du eine Mindestgröße setzen.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Mit dem Kommando Größe anheben oder Größe verringern, kannst du den Größenfilter aktivieren und gleichzeitig die Mindestgröße anpassen.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText('Möchtest du den Größenfilter deaktivieren, sage Größe ist egal.'),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => filterintroDone(),
    () => resume()
  ]);
}

const closeFilter = () => {
  stop = true;
  VoiceInteraction.speakText('Filtermenü geschlossen');
  filterActive = false;
  setTimeout(resume, 500);
}

const help = ()=> {
  DualPantoFramework.run_script([
    () => stop ? nothing() : VoiceInteraction.speakText('Sage Wo bin ich und ich gebe dir Anhaltspunkte in Berlin.'),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop ? nothing() : VoiceInteraction.speakText('Sage Wohnungen und ich zeige dir alle Wohnungen.'),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop ? nothing() : VoiceInteraction.speakText('Du kannst auch selbst herumlaufen und Wohnungen finden.'),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop ? nothing() : VoiceInteraction.speakText('Mit Filter öffnest du das Filtermenü.'),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => resume()
  ]);
}

const showApartments = ()=> {
  follow = false;
  let script = [];
  for(const apartment of apartments){
    if(apartment.matchFilters()){
      const hasCellar = apartment.cellar ? 'einen' : 'keinen';
      script.push(() => stop ? nothing() : VoiceInteraction.speakText('Hier'));
      script.push(() => stop ? nothing() : device.movePantoTo(1, apartment.cords));
      script.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
      script.push(() => stop ? nothing() : VoiceInteraction.speakText('ist eine Wohnung in ' + apartment.area));
      script.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
      script.push(() => stop ? nothing() : VoiceInteraction.speakText('Die Wohnung Kostet ' + apartment.price + ' Euro im Monat.'));
      script.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
      script.push(() => stop ? nothing() : VoiceInteraction.speakText('Die Wohnung ist ' + apartment.size + ' Quadratmeter groß.'));
      script.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
      script.push(() => stop ? nothing() : VoiceInteraction.speakText('Die Wohnung hat ' + apartment.amountRooms + ' Räume.'));
      script.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
      script.push(() => stop ? nothing() : VoiceInteraction.speakText('Die Wohnung hat' + hasCellar + ' Keller.'));
      script.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));

    }
  }
  script.push(() => refollow());
  script.push(() => resume());
  DualPantoFramework.run_script(script);
}

const moveToKreuzberg = ()=> {
  filter.area = true;
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
  filter.area = true;
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
  filter.area = true;
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
  filter.area = false;
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

const nothing = () =>{
  return new Promise(resolve => {
    resolve(resolve);
  });
}

const resume = () =>{
  return new Promise(resolve => {
    stop = false;
    resolve(resolve);
  });
}

const filterintroDone = () => {
  return new Promise(resolve => {
    firstTimefiler = false;
    resolve(resolve);
  });
}

const promiseObstacles = (pointArray, index=-1)=>{
  return new Promise (resolve => {
    activeObstacles.push(device.createObstacle(pointArray, index));
    resolve(resolve);
  });
}

const showMitte = () => {
  return new Promise (resolve => {
    DualPantoFramework.run_script([
      () => device.movePantoTo(1, new Vector(-150, -40, NaN)),
      () => DualPantoFramework.waitMS(1000),
      () => device.movePantoTo(1, new Vector(-150, -100, NaN)),
      () => DualPantoFramework.waitMS(1000),
      () => device.movePantoTo(1, new Vector(50, -100, NaN)),
      () => DualPantoFramework.waitMS(1000),
      () => device.movePantoTo(1, new Vector(50, -40, NaN)),
      () => DualPantoFramework.waitMS(1000),
      () => device.movePantoTo(1, new Vector(-150, -40, NaN))
    ]);
    resolve(resolve);
  });
}

