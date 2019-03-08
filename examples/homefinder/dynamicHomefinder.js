const DualPantoFramework = require('../..');
const VoiceInteraction = DualPantoFramework.voiceInteraction;
const {Vector} = DualPantoFramework;

const language = process.argv[2] ? process.argv[2] : 'DE';
let device;
let follow = false;
let activeObstacles = [];
let stop = false;
let filterActive = false;
let maxprice = 4500;
let firstTimefiler = true;
let currentApartment;
let priceActive = false;
let sizeActive = false;
let roomsActive = false;
let cellarActive = false;
let lastRotation = 0;
let lastSpokenPrice = 0;
let lastSpokenRooms = 0;
let lastSpokenSize = 0;
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
let helpRunning = false;
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
      currentApartment = apartments[i];
      follow = false;
      DualPantoFramework.run_script([
        () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'Here', 'DE' : 'Hier'}[language], language),
        () => stop ? nothing() : device.movePantoTo(1, apartments[i].cords),
        () => stop ? nothing() : DualPantoFramework.waitMS(500),
        () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'is an apartment', 'DE' : 'ist eine Wohnung'}[language], language),
        () => stop ? nothing() : DualPantoFramework.waitMS(500),
        () => refollow(),
        () => resume()
      ]);
      return
    }
  }
}

const getDetails = () => {
  if(language === 'EN'){
    hasCellar = currentApartment.cellar ? 'a' : 'no';
  }else{
    hasCellar = currentApartment.cellar ? 'einen' : 'keinen';
  }
  DualPantoFramework.run_script([
    () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'The rent is ' + currentApartment.price + ' Euro per month.', 'DE' : 'Die Miete beträgt ' + currentApartment.price + ' Euro pro Monat'}[language], language),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'It is ' + currentApartment.size + ' squaremeter big,', 'DE' : 'Sie ist ' + currentApartment.size + ' Quadratmeter groß.'}[language], language),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'has ' + currentApartment.amountRooms + ' rooms and ', 'DE' : 'hat ' + currentApartment.amountRooms + ' Räume und '}[language], language),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'has' + hasCellar + ' celler.', 'DE' : 'hat ' + hasCellar + ' Keller.'}[language], language),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
  ]);
}

const areaChange = () => {
  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText({'EN' : 'You are in ', 'DE' : 'Du bist in '}[language], language),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText(area),
    () => DualPantoFramework.waitMS(50)
  ]);
}
const start = ()=> {
  if(language === 'EN'){
    console.log('english input');
    VoiceInteraction.setCommands(['apartments', 'Kreuzberg', 'Mitte', 'Tempelhof', 'Berlin', 'price up', 'price down', 'more rooms', 'less rooms', 'cellar needed', 'meet basement', 'need cellar', 'no cellar', 'increase size', 'decrease size', 'prices does not matter', 'size does not matter', 'cellar does not matter', 'rooms do not matter', 'help', 'search criteria', 'done', 'where am I', 'stop', 'cancel', 'details']);
  }else{
    VoiceInteraction.setCommands(['Wohnungen', 'Kreuzberg', 'Mitte', 'Tempelhof', 'Berlin','Preis hoch', 'Preis runter', 'mehr Räume', 'weniger Räume', 'Keller ist notwendig', 'kein Keller', 'Größe anheben', 'Größe verringern', 'Preis ist egal', 'Größe ist egal', 'Keller ist egal', 'Anzahl der Räume ist egal', 'Hilfe', 'Suchkriterien', 'Stop', 'stop', 'fertig', 'Wo bin ich', 'halt', 'abbrechen', 'Abbruch', 'Details']);
  }
  device.on('handleMoved', function(index, position){
    if(follow && index == 0){
      getArea(position);
      poiNearby(position);
    }
    if(priceActive && index == 0){
      const rotDifference = position.r - lastRotation;
      maxprice = maxprice + Math.round(100 * rotDifference);
      if(Math.abs(maxprice - lastSpokenPrice) > 100){
        VoiceInteraction.speakText({'EN' : 'new maximum price: ' + maxprice, 'DE' : 'Neuer Maximalpreis: ' + maxprice}[language], language);
        lastSpokenPrice = maxprice;
      }      
    }
    if(sizeActive && index == 0){
      const rotDifference = position.r - lastRotation;
      minSize = minSize + Math.round(20 * rotDifference);
      if(Math.abs(minSize - lastSpokenSize) > 20){
        VoiceInteraction.speakText({'EN' : 'new minimum size: ' + minSize, 'DE' : 'Neue Minimalgröße: ' + minSize}[language], language);
        lastSpokenSize = minSize;
      }      
    }
    if(cellarActive && index == 0){
      const rotDifference = position.r - lastRotation;
      if(rotDifference >= 2 * Math.PI){
        if(filter.cellar){
          filter.celler = false;
          VoiceInteraction.speakText({'EN' : 'without cellar', 'DE' : 'ohne Keller'}[language], language);
        }else{
          filter.celler = true;
          VoiceInteraction.speakText({'EN' : 'with cellar', 'DE' : 'mit Keller'}[language], language);
        }
      }      
    }
    if(roomsActive && index == 0){
      const rotDifference = position.r - lastRotation;
      minRooms = minRooms + Math.round(rotDifference / Math.PI);
      if(Math.abs(minRooms - lastSpokenRooms) > 1){
        VoiceInteraction.speakText({'EN' : 'new minimum amount of rooms: ' + minRooms, 'DE' : 'Minimale Anzahl an Räumen: ' + minRooms}[language], language);
        lastSpokenRooms = minRooms;
      }      
    }
    if(index == 0){
      lastRotation = position.r;
    }
  });

  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText({'EN' : 'You are here', 'DE' : 'Du bist hier'}[language], language),
    () => device.movePantoTo(0, startPosition),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText({'EN' : 'at Berlin Alexanderplatz', 'DE' : 'am Alexanderplatz'}[language], language),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText({'EN' : 'that is in Berlin Mitte', 'DE' : 'Das liegt in Berlin Mitte'}[language], language),
    () => showMitte(),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText({'EN' : 'say: apartments, where am I, search criteria, help', 'DE' : 'sag: Wohnungen, Wo bin ich, Suchkriterien, Hilfe'}[language], language),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText({'EN' : 'Or walk around the city with the me handle', 'DE' : 'oder laufe mit dem me handle durch die Stadt.'}[language], language),
    () => device.unblockHandle(0),
    () => refollow(),
    () => VoiceInteraction.beginListening()
  ]);

  //'Wohnungen', 'Kreuzberg', 'Mitte', 'Tempelhof', 'Preis hoch', 'Preis runter', 'mehr Räume', 'weniger Räume', 'Keller ist notwendig', 'kein Keller', 'Größe anheben', 'Größe verringern', 'Preis ist egal', 'Größe ist egal', 'Keller ist egal'
  VoiceInteraction.on('keywordRecognized', function(word){
    if(filterActive && (word === 'Preis ist egal' || word === 'price does not matter')){
      if(priceActive){
        priceActive = false;
        VoiceInteraction.speakText({'EN' : 'Maximal Price removed', 'DE' : 'Maximalpreis entfernt'}[language], language);
        filter.price = false;
      }
    }
    if(word === 'Wohnungen' || word === 'apartments'){
      showApartments();
    }
    if(filterActive && (word === 'Anzahl der Räume ist egal' || word === 'rooms do not matter')){
      if(roomsActive){
        roomsActive = false;
        filter.amountRooms = false;
        VoiceInteraction.speakText({'EN' : 'Minimum amount of rooms removed', 'DE' : 'Minimalanzahl an Räumen entfernt'}[language], language);
      }
    }
    if(filterActive && (word === 'Keller ist egal' || word === 'cellar does not matter')){
      if(cellarActive){
        cellarActive = false;
        VoiceInteraction.speakText({'EN' : 'Cellar does not matter', 'DE' : 'Keller egal'}[language], language);
        filter.cellar = false;
      }
    }
    if(filterActive && (word === 'Größe ist egal' || word === 'size does not matter')){
      if(priceActive){
        priceActive = false;
        VoiceInteraction.speakText({'EN' : 'Minimum size removed', 'DE' : 'Minimalgröße entfernt'}[language], language)
        filter.size = false;
      }
    }
    if(filterActive && (word === 'Preis' || word === 'price') && !roomsActive && !cellarActive && !sizeActive){
      configurePrice();
    }
    if(filterActive && (word === 'Räume' || word === 'rooms') && !priceActive && !cellarActive && !sizeActive){
      configureRooms();
    }
    if(filterActive && (word === 'Keller' || word === 'cellar') && !roomsActive && !priceActive && !sizeActive){
      configureCellar();
    }
    if(filterActive && (word === 'Größe' || word === 'size') && !roomsActive && !cellarActive && !priceActive){
      configureSize();
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
    if(word === 'Hilfe' || word === 'help'){
      if(filterActive){
        firstTimefiler = true;
        initFilter();
      }else if(!helpRunning){
        helpRunning = true;
        help();
      }
    }
    if(word === 'Suchkriterien' || word === 'search criteria'){
      initFilter();
    }
    if(word === 'Stop' || word === 'stop' || word === 'halt' || word === 'abbrechen' || word === 'Abbruch' || word === 'cancel'){
      stop = true;
    }
    if(filterActive && (word === 'fertig' || word === 'done')){
      if(priceActive){
        priceActive = false;
        filter.price = true;
      }else{
        closeFilter();
      }
    }
    if(word === 'Wo bin ich' || word === 'where am I'){
      follow = false;
      locationhelp();
    }
    if(word === 'Details' || word === 'details'){
      if(currentApartment){
        stop = true;
        getDetails();
      }
    }
  });
}

const locationhelp = () => {
  let temp = [];
  temp.push(() => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'Here', 'DE' : 'Hier'}[language], language));
  temp.push(() => stop ? nothing() : device.movePantoTo(1, startPosition));
  temp.push(() => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'is the Alexanderplatz', 'DE' : 'Ist der Alexanderplatz'}[language], language));
  temp.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
  temp.push(() => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'the s seven is going along this way', 'DE' : 'Die S sieben fährt hier lang'}[language], language));
  temp.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
  for(const station of s7){
    temp.push(() => stop ? nothing() : device.movePantoTo(1, station.point));
    temp.push(() => stop ? nothing() : VoiceInteraction.speakText(station.name));
    temp.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
  }
  temp.push(() => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'the s one is going along this way', 'DE' : 'Die S eins fährt hier lang'}[language], language));
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
    () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'search criteria menu. Say done to leave', 'DE' : 'Suchkriterienmenü. Sage fertig um das Menü zu verlassen'}[language], language),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'there are different search criteria: price, rooms, cellar and size', 'DE' : 'Es gibt verschiedene Suchkriterien: Preis, Räume, Keller und Größe'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'The price search criteria sets a maximum price.', 'DE' : 'Um das Preissuchkriterium zu aktivieren musst du einen Maximalpreis setzen.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'Say price up or down to change the maximum price.', 'DE' : 'Mit dem Kommando Preis hoch oder Preis runter, kannst du das Preissuchkriterium aktivieren und gleichzeitig den Preis anpassen.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'with price does not matter can you deactivate the search criteria', 'DE' : 'Möchtest du das Preissuchkriterium deaktivieren, sage Preis ist egal.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'The room search criteria sets a minimum amount of rooms.', 'DE' : 'Um das Raumsuchkriterium zu aktivieren musst du einen Mindestanzahl an Räumen setzen.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'Say more or less rooms to change the minimum', 'DE' : 'Mit dem Kommando mehr Räume oder weniger Räume, kannst du das Raumsuchkriterium aktivieren und gleichzeitig die Mindestanzahl an Räumen anpassen.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'To deactivate the search criteria say rooms do not matter', 'DE' : 'Möchtest du das Raumsuchkriterium deaktivieren, sage Anzahl der Räume ist egal.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'The cellar search criteria filters apartments for the existences of cellars', 'DE' : 'Um das Kellersuchkriterium zu aktivieren musst du angeben, ob du einen Keller möchtest oder nicht.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'Say cellar needed or no cellar to change your preferences.', 'DE' : 'Mit dem Kommando Keller ist notwendig oder kein Keller, setzt du deine Präferenz und aktivierst den Keller.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'cellar does not matter deactivates the search criteria', 'DE' : 'Möchtest du das Kellersuchkriterium deaktivieren, sage Keller ist egal.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'The size search criteria sets a minimum size.', 'DE' : 'Um das Größensuchkriterium zu aktivieren musst du eine Mindestgröße setzen.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'say increase or decrease size to adjust the value', 'DE' : 'Mit dem Kommando Größe anheben oder Größe verringern, kannst du das Größensuchkriterium aktivieren und gleichzeitig die Mindestgröße anpassen.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'size does not matter deactivates the search criteria', 'DE' : 'Möchtest du das Größensuchkriterium deaktivieren, sage Größe ist egal.'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => filterintroDone(),
    () => resume()
  ]);
}

const initNewFilter = () =>{
  filterActive = true;
  const currentRotation = device.getMePosition().r;
  DualPantoFramework.run_script([
    () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'search criteria menu. Say done to leave', 'DE' : 'Suchkriterienmenü. Sage fertig um das Menü zu verlassen'}[language], language),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'there are different search criteria: price, rooms, cellar and size', 'DE' : 'Es gibt verschiedene Suchkriterien: Preis, Räume, Keller und Größe'}[language], language),
    () => stop || !firstTimefiler ? nothing() : DualPantoFramework.waitMS(500),
    () => stop || !firstTimefiler ? nothing() : VoiceInteraction.speakText({'EN' : 'which one do you want to set?', 'DE' : 'Welches möchtest du einstellen?'}[language], language),
    () => resume()
  ]);
}

const configurePrice = () => {
  priceActive = true;
  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText({'EN' : 'rotate the me handle to set the price. Say done when you are finished', 'DE' : 'drehe den oberen Griff um den Preis einzustellen. Sage fertig wenn du den Preis eingestellt hast.'}[language], language),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText({'EN' : 'say price does not matter to deactivate the maximum price', 'DE' : 'sage Preis ist egal um den Maxmimalpreis zu deaktivieren'}[language], language)
  ]);
}

const configureSize = () => {
  sizeActive = true;
  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText({'EN' : 'rotate the me handle to set the size. Say done when you are finished', 'DE' : 'drehe den oberen Griff um die Größe einzustellen. Sage fertig wenn du die Größe eingestellt hast.'}[language], language),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText({'EN' : 'say size does not matter to deactivate the minimum size', 'DE' : 'sage Größe ist egal um die Minimalgröße zu deaktivieren'}[language], language)
  ]);
}

const configureRooms = () => {
  roomsActive = true;
  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText({'EN' : 'rotate the me handle to set the amount of rooms. Say done when you are finished', 'DE' : 'drehe den oberen Griff um die Anzahl der Räume einzustellen. Sage fertig wenn du alles eingestellt hast.'}[language], language),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText({'EN' : 'say rooms do not matter to deactivate the filter', 'DE' : 'sage Anzahl der Räume ist egal um den filter zu deaktivieren'}[language], language)
  ]);
}

const configureCellar = () => {
  cellarActive = true;
  DualPantoFramework.run_script([
    () => VoiceInteraction.speakText({'EN' : 'rotate the me handle to set cellar or no cellar. Say done when you are finished', 'DE' : 'drehe den oberen Griff um Keller oder kein Keller einzustellen. Sage fertig am Ende.'}[language], language),
    () => DualPantoFramework.waitMS(500),
    () => VoiceInteraction.speakText({'EN' : 'say cellar does not matter to deactivate this option.', 'DE' : 'sage Kellers ist egal um das Kellerkriterium zu deaktivieren'}[language], language)
  ]);
}


const closeFilter = () => {
  stop = true;
  VoiceInteraction.speakText({'EN' : 'Search criteria menu closed', 'DE' : 'Suchkriterienmenü geschlossen'}[language], language);
  filterActive = false;
  setTimeout(resume, 500);
}

const help = ()=> {
  DualPantoFramework.run_script([
    () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'say where am I and I show you knowen points', 'DE' : 'Sage Wo bin ich und ich gebe dir Anhaltspunkte in Berlin.'}[language], language),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'say apartments and I show you apartments', 'DE' : 'Sage Wohnungen und ich zeige dir alle Wohnungen.'}[language], language),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'say search criteria and you open the specific menu', 'DE' : 'Mit Suchkriterien öffnest du das entsprechende Menü.'}[language], language),
    () => stop ? nothing() : DualPantoFramework.waitMS(500),
    () => resume()
  ]);
}

const showApartments = ()=> {
  follow = false;
  let script = [];
  for(const apartment of apartments){
    if(apartment.matchFilters()){
      script.push(() => stop ? nothing() : setCurrentApartment(apartment));
      script.push(() => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'Here', 'DE' : 'Hier'}[language], language));
      script.push(() => stop ? nothing() : device.movePantoTo(1, apartment.cords));
      script.push(() => stop ? nothing() : DualPantoFramework.waitMS(500));
      script.push(() => stop ? nothing() : VoiceInteraction.speakText({'EN' : 'is an apartment', 'DE' : 'ist eine Wohnung'}[language], language));
      script.push(() => stop ? nothing() : DualPantoFramework.waitMS(2000));
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
      () => VoiceInteraction.speakText({'EN' : 'You are now in Kreuzberg', 'DE' : 'Du bist jetzt in Kreuzberg'}[language], language),
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
      () => VoiceInteraction.speakText({'EN' : 'You are now in Tempelhof', 'DE' : 'Du bist jetzt in Tempelhof'}[language], language),
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
      () => VoiceInteraction.speakText({'EN' : 'You are now in Mitte', 'DE' : 'Du bist jetzt in Mitte'}[language], language),
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
  () => VoiceInteraction.speakText({'EN' : 'You are now in Berlin', 'DE' : 'Du bist jetzt in Berlin'}[language], language)
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
    if(helpRunning){
      helpRunning = !helpRunning;
    }
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

const setCurrentApartment = (apartment) => {
  return new Promise (resolve => {
    currentApartment = apartment;
    resolve(resolve);
  });
}
