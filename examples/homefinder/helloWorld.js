'use strict';

const child_process = require('child_process'),
      fs = require('fs'),
      path = require('path'),
      serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./Vector.js'),
      //DoomTutorial = require('./DoomTutorial.js')
      //config = JSON.parse(fs.readFileSync('config.json')),
      persistent = JSON.parse(fs.readFileSync('persistent.json')), // TODO: Initalize
      say = require('say-promise'),
      PlaySound = require('play-sound')(),
      TWEEN = require('@tweenjs/tween.js'),
      co = require('co');

const origin = new Vector(1500, -1000),
      scale = 20;

var follow = false;

let upperPanto, lowerPanto;
const TWEEN_INTERVAL = 30; //ms
var tween_stack_counter = 0;

var last_poi_length = 0;
const DEBUG_WITHOUT_SERIAL = false;
var SERIAL_EXISTS = true;

const TUTORIAL_LANGUAGE = "EN"; //"EN" or "DE"

const CORDS_OF_INTERES = [[105, -3230, NaN],[1023, -3281, NaN],[2023, -2431, NaN],[2711, -2688, NaN],[3107, -3289, NaN],[3007, -4319, NaN]]


const TUTORIAL_ENABLED = true;

const SIGHT_SURVEY_INCLUDE_CLASSES = [
    'House',
    'Apparment',
    'Street',
    'River'
]
const last_N_bookmarks_length = 2;

function animateTween() {
    TWEEN.update();
    if(tween_stack_counter > 0) {
        setTimeout(animateTween, TWEEN_INTERVAL);
    }
}

function *conditional_promise_generator(promise_list, condition_fn){
  for(var i = 0; condition_fn() && i < promise_list.length; i++) {
      yield promise_list[i]();
  }
}

function inBoundingBox(x, y, left, right, top, bottom) {
    return (x > left && x < right && y < top && y > bottom);
}

function coords2place(x, y) {
    var location = "";
    if (inBoundingBox(x, y, -303, 513, -3024, -3437)) {
        location = "start";
    } else if (inBoundingBox(x, y, 720, 1327, -2900, -3663)) {
        room = "apparment_first";     
    } else if (inBoundingBox(x, y, 1568, 2479, -2128, -2735)) {
        room = "apparment_second";
    } else if (inBoundingBox(x, y, 2479, 2943, -2576, -2800)) {
        room = "apparment_third";
    } else if (inBoundingBox(x, y, 2768, 3447, -2928, -3650)) {
        room = "house_first";
    } else if (inBoundingBox(x, y, 2704, 3311, -4048, -4591)) {
        room = "house_second";
    } /*else if (inBoundingBox(x, y, 2928, 3087, -4688, -4847)) {
        room = "elevator";
    }*/
    //todo add street and river
    return location;
}
var TUTORIAL_TEXT;
TUTORIAL_TEXT = {
    START_INTRO : [
        "Hello I want to present you the nearby location.",
        "You are currently here.",
        "I will show you now possible places to rent."
    ],
    APPARTMENT_FIRST_INTRO : [
        "This",
        "is the first apparment.",
        "It is cheap but small.", //leed => phonetic for speech output
    ],
    APPARTMENT_SECOND_INTRO : [
        "This",
        "is the second apparment.",
        "It is expensive but it looks better.", //leed => phonetic for speech output
    ],
    APPARTMENT_THIRD_INTRO : [
        "This",
        "is the third apparment.",
        "It is extremly expensive but it has a whirlpool.", //leed => phonetic for speech output
    ],
    HOUSE_FIRST_INTRO : [
        "This",
        "is the first house.",
        "It is moderatly cheap for a house but it is old and needs to be renovated."
    ],
    HOUSE_SECOND_INTRO : [
        "This",
        "is the second house.",
        "It is almost not affordable but you will live in the center of the city with Mark Wahlberg and Chris Pratt as your neighbors."
    ],
    HALL_TARGET_PRACTICE : [
        "Good, looks like your pistol is working. Let's try some target practice",
        "Here's an explosive barrel. You can aim at it by rotating the me handle. Try shooting it - it should explode after two direct hits."
    ],
    SURVEY : {
        YOU_ARE_IN : "You are in the ",
        PASSAGE_TO_ARMORY : "Passage to armory is here",
        PASSAGE_TO_GUARDPOST : "Passage to the gard post",
        PASSAGE_TO_HALL : "Passage to hall is here",
        STAIRS : "Stairs to ledge",
        YOU_ARE_HERE : "You are here",
        APPARTMENT_FIRST : "The first apparment is here",
        APPARTMENT_SECOND : "The second apparment is here",
        APPARMENT_THIRD : "The third apparment is here",
        HOUSE_FIRST : "The first house is here",
        HOUSE_SECOND : "The second house is here",
        RIVER : "The River flows here",
        STREET : "The streets goes this way"
    }
};
var current_place = "start";

class Dis {
  constructor(){

  //hashmap: [""] -> function, where keys are lists of last bookmark names to compare against, and functions are callbacks
        this.bookmark_triggers = {}; 

        //todo: put the DoomController into an object, pass to Doom Tutorial, make these functions part of that interface
        //this.doomProcess = null;
        //this.movePantoFunction = function(a,b) {console.log("ERROR: MovePantoFunction not set");};
        //this.doomToPantoCoordFunction = function(a) {console.log("ERROR: doomToPantoCoordFunction not set");};
        //this.player = null;
        //this.playerlocation = "start";
        this._initialize_pickup_functions();
      }

  run_script(promise_list) {
        this._running_script = true;
        var script_generator = conditional_promise_generator(promise_list, () => this._running_script);
        co(script_generator)
        .catch(console.log)
    }
  _initialize_pickup_functions() {}

  setMovePantoFunction(movePanto_fn)
    {
        this.movePantoFunction = movePanto_fn;
    }

    movePantoTo(index, target, duration, interpolation_method=TWEEN.Easing.Quadratic.Out)
    {
        return new Promise (resolve => 
        {
            this.movePantoFunction(index, target, duration, interpolation_method);
            resolve(resolve);
        });
    }

    setDoomToPantoCoordFunction(new_doomToPantoCoordFunction)
    {
        this.doomToPantoCoordFunction = new_doomToPantoCoordFunction;
    }

    addBookmarkTrigger(key, fn) {
        this.bookmark_triggers[String(key)] = fn;
    }

    handlePlayerSpawn() {
            this.run_script([
                () => this.speakText(TUTORIAL_TEXT.START_INTRO[0]),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.START_INTRO[1]),
                () => this.movePantoTo(0, this.doomToPantoCoordFunction([105, -3230, NaN]), 500),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([105, -3230, NaN]), 500),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.START_INTRO[2]),
                () => this.waitMS(500),
                () => this.handle_appartment_first();
                () => this.waitMS(1500),
                () => this.handle_appartment_second();
                () => this.waitMS(1500),
                () => this.handle_appartment_third();
                () => this.waitMS(1500),
                () => this.handle_house_first();
                () => this.waitMS(1500),
                () => this.handle_house_second();
                () => this.waitMS(1500),


                () => this.movePantoTo(0, this.doomToPantoCoordFunction([NaN, NaN, NaN]), 500),
                //() => this.movePantoTo(1, this.doomToPantoCoordFunction([NaN, NaN, NaN]), 500),
                follow = true;
            ]);
            
    }

    handle_appartment_first(){
      this.run_script([
        () => this.speakText(TUTORIAL_TEXT.APPARTMENT_FIRST_INTRO[0]),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([1023, -3281, NaN]), 500),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.APPARTMENT_FIRST_INTRO[1]),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.APPARTMENT_FIRST_INTRO[2]),
                () => this.waitMS(500),
                ]);
    }

    handle_appartment_second(){
           this.run_script([           
            () => this.speakText(TUTORIAL_TEXT.APPARTMENT_SECOND_INTRO[0]),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([2023, -2431, NaN]), 500),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.APPARTMENT_SECOND_INTRO[1]),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.APPARTMENT_SECOND_INTRO[2]),
                () => this.waitMS(500),
                ]);
    }

    handle_appartment_third(){
      this.run_script([
                () => this.speakText(TUTORIAL_TEXT.APPARTMENT_THIRD_INTRO[0]),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([2711, -2688, NaN]), 500),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.APPARTMENT_THIRD_INTRO[1]),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.APPARTMENT_THIRD_INTRO[2]),
                () => this.waitMS(500),
        ]);
    }

    handle_house_first(){
      this.run_script([
                () => this.speakText(TUTORIAL_TEXT.HOUSE_FIRST_INTRO[0]),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([3107, -3289, NaN]), 500),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.HOUSE_FIRST_INTRO[1]),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.HOUSE_FIRST_INTRO[2]),
                () => this.waitMS(500),
        ]);
    }

    handle_house_second(){
      this.run_script([
                () => this.speakText(TUTORIAL_TEXT.HOUSE_SECOND_INTRO[0]),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([3007, -4319, NaN]), 500),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.HOUSE_SECOND_INTRO[1]),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.HOUSE_SECOND_INTRO[2]),
                () => this.waitMS(500),
        ]);
    }




    handleBookmark(bookmarkName) {
        //update last N bookmarks
        this.last_N_bookmarks.push(bookmarkName); 
        this.last_N_bookmarks = this.last_N_bookmarks.slice(-this.last_N_bookmarks_length); //maintain buffer size

        //call all triggers from encountered bookmark
        for (var i_bookmarksize = 1; i_bookmarksize <= this.last_N_bookmarks.length; i_bookmarksize++)
        {
            var trigger_key = String(this.last_N_bookmarks.slice(-i_bookmarksize));
            if (trigger_key in this.bookmark_triggers)
            {
                this.bookmark_triggers[trigger_key]();
            }
        }
    }

    handleKeyPress(keypresspacket) {
    }

    speakText(txt) {
        var speak_voice = "Alex";
        if (TUTORIAL_LANGUAGE == "DE") {
            speak_voice = "Anna";
        }
        return say.speak(txt, speak_voice, 2.0, (err) => {
            if(err) {
                console.error(err);
                return;
            }
        });
    }

    playSound(filename) {
    }
    waitMS(ms) {
        return new Promise(resolve => setTimeout(() => resolve(resolve), ms));
    }

    initializeTestTutorial() {
        if(this._tutorial_enabled)
        {
            this.addBookmarkTrigger(
                ["ENTER APPARTMENT_FIRST"],
                  this.run_script([
                      () => this.speakText(TUTORIAL_TEXT.APPARTMENT_FIRST_INTRO[0]),
                      () => this.speakText(TUTORIAL_TEXT.APPARTMENT_FIRST_INTRO[1]),
                  ])
                  );
            this.addBookmarkTrigger(
                ["ENTER APPARTMENT_SECOND"],
                  this.run_script([
                      () => this.speakText(TUTORIAL_TEXT.APPARTMENT_SECOND_INTRO[0]),
                      () => this.speakText(TUTORIAL_TEXT.APPARTMENT_SECOND_INTRO[1]),
                  ])
                  );
            this.addBookmarkTrigger(
                ["ENTER APPARTMENT_THIRD"],
                  this.run_script([
                      () => this.speakText(TUTORIAL_TEXT.APPARTMENT_THIRD_INTRO[0]),
                      () => this.speakText(TUTORIAL_TEXT.APPARTMENT_THIRD_INTRO[1]),
                  ])
                  );
            this.addBookmarkTrigger(
                ["ENTER HOUSE_FIRST"],
                  this.run_script([
                      () => this.speakText(TUTORIAL_TEXT.HOUSE_FIRST_INTRO[0]),
                      () => this.speakText(TUTORIAL_TEXT.HOUSE_FIRST_INTRO[1]),
                  ])
                  );
            this.addBookmarkTrigger(
                ["ENTER HOUSE_SECOND"],
                  this.run_script([
                      () => this.speakText(TUTORIAL_TEXT.HOUSE_SECOND_INTRO[0]),
                      () => this.speakText(TUTORIAL_TEXT.HOUSE_SECOND_INTRO[1]),
                  ])
                  );
            }
    }

    stopSightSurvey() {
        this._running_sight_survey = false;
    }

    _ifRunningSightSurvey(fn) {
        if (this._running_sight_survey)
        {
            return fn();
        } else {
            return reject("No longer running sight survey");
        }
    }
    handle_movement(cords){
      var new_place = coords2place(cords);
      if{ !new_place == current_place;
        switch(new_place){
          case 'apparment_first':
            handle_appartment_first();
            waitMS(1500);
        }
      }
    }

    startSightSurvey() {
        if(!this._running_sight_survey)
        {
            this._running_sight_survey = true; 
            this.run_script([
              () => this.speakText(TUTORIAL_TEXT.APPARTMENT_FIRST_INTRO[0]),
              () => this.movePantoTo(1, this.doomToPantoCoordFunction([1023, -3281, NaN]), 500),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.APPARTMENT_FIRST_INTRO[1]),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.APPARTMENT_FIRST_INTRO[2]),
              () => this.waitMS(500),

              () => this.speakText(TUTORIAL_TEXT.APPARTMENT_SECOND_INTRO[0]),
              () => this.movePantoTo(1, this.doomToPantoCoordFunction([2023, -2431, NaN]), 500),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.APPARTMENT_SECOND_INTRO[1]),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.APPARTMENT_SECOND_INTRO[2]),
              () => this.waitMS(500),

              () => this.speakText(TUTORIAL_TEXT.APPARTMENT_THIRD_INTRO[0]),
              () => this.movePantoTo(1, this.doomToPantoCoordFunction([2711, -2688, NaN]), 500),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.APPARTMENT_THIRD_INTRO[1]),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.APPARTMENT_THIRD_INTRO[2]),
              () => this.waitMS(500),

              () => this.speakText(TUTORIAL_TEXT.HOUSE_FIRST_INTRO[0]),
              () => this.movePantoTo(1, this.doomToPantoCoordFunction([3107, -3289, NaN]), 500),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.HOUSE_FIRST_INTRO[1]),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.HOUSE_FIRST_INTRO[2]),
              () => this.waitMS(500),

              () => this.speakText(TUTORIAL_TEXT.HOUSE_SECOND_INTRO[0]),
              () => this.movePantoTo(1, this.doomToPantoCoordFunction([3007, -4319, NaN]), 500),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.HOUSE_SECOND_INTRO[1]),
              () => this.waitMS(500),
              () => this.speakText(TUTORIAL_TEXT.HOUSE_SECOND_INTRO[2]),
              () => this.waitMS(500),

              () => this.movePantoTo(0, this.doomToPantoCoordFunction([NaN, NaN, NaN]), 500),
              () => this.movePantoTo(1, this.doomToPantoCoordFunction([NaN, NaN, NaN]), 500),
            ]);
            displayPromise = displayPromise.catch( () => null);
        }
    }

};
function tweenPantoTo(index, target, duration, interpolation_method=TWEEN.Easing.Quadratic.Out)
{
    
    if (duration == undefined) {
        duration = 500;
    }
    var tweenPosition = undefined;
    if (index == 0 && upperPanto) {
        tweenPosition = upperPanto;
    } else if (index == 1 && lowerPanto) {
        tweenPosition = lowerPanto;
    }
    if(tweenPosition)
    {
        tween_stack_counter++;

        if(tween_stack_counter == 1)
        {
            setTimeout(animateTween, TWEEN_INTERVAL);
        }

        var tween = new TWEEN.Tween(tweenPosition) // Create a new tween that modifies 'tweenPosition'.
            .to(target, duration)
            .easing(interpolation_method) // Use an easing function to make the animation smooth.
            .onUpdate(function() { // Called after tween.js updates 'tweenPosition'.
                movePantoTo(index, tweenPosition);
            })
            .onComplete(function() {
                tween_stack_counter--;
            })
            .start(); // Start the tween immediately.
        }
}

function movePantoTo(index, target) {
    const values = (target) ? [target.x, target.y, target.r] : [NaN, NaN, NaN],
          data = new Buffer(1+3*4);
    data[0] = index;
    data.writeFloatLE(values[0], 1);
    data.writeFloatLE(values[1], 5);
    data.writeFloatLE(values[2], 9);
    serial.send(data);
}

function doomToPantoCoord(pos) {
    return new Vector((pos[0]-origin.x)/scale, (pos[1]-origin.y)/scale, pos[3]/180*Math.PI);
}

function pantoToDoomCoord(pos) {
    return [
        Math.round(pos.x*scale+origin.x),
        Math.round(pos.y*scale+origin.y),
        Math.round(pos.r/Math.PI*180)
    ];
}

try{
  serial.open("/dev/cu.usbmodem1421");
} catch (e) {
    console.log("ERROR: No serial port attached.");
    if (DEBUG_WITHOUT_SERIAL)
    {
        console.log("DEBUG: DEBUG_WITHOUT_SERIAL is true, so running with SERIAL_EXISTS=false.");
        SERIAL_EXISTS = false;
    }
}
var distut = new Dis();
function serialRecv() {
    setImmediate(serialRecv);
    const packets = serial.poll();
    if(packets.length == 0)
        return;
    const packet = packets[packets.length-1];
    if(packet.length != 4*6)
        return;

    const values = [];
    for(let i = 0; i < 6; ++i)
        values[i] = packet.readFloatLE(i*4);
    upperPanto = new Vector(values[0], values[1], values[2]);
    lowerPanto = new Vector(values[3], values[4], values[5]);
    if (follow){
      handle_movement(pantoToDoomCoord(upperPanto));
    }
}
if (SERIAL_EXISTS)
{
serialRecv();
}
distut.setMovePantoFunction(tweenPantoTo);
distut.setDoomToPantoCoordFunction(doomToPantoCoord);
distut.handlePlayerSpawn();

console.log("Hello World");


process.on('exit', function(code) {  
    movePantoTo(0);
    movePantoTo(1);
});