'use strict';

const   say = require('say-promise'),
        PlaySound = require('play-sound')(),
        TWEEN = require('@tweenjs/tween.js'),
        co = require('co');

const PICKUP_EPSILON = 60; 


const TUTORIAL_LANGUAGE = "DE"; //"EN" or "DE"

const SIGHT_SURVEY_INCLUDE_CLASSES = [
    'ArmorBonus',
    'GreenArmor',
    'HealthBonus',
    'ShellBox',
    'Medikit',
    'ClipBox',
    'BlueArmor',
    'Zombieman',
    'HexenArmor',
    'ExplosiveBarrel'
]

const TARGET_PRACTICE_STATE = {
    BEFORE_TARGET_PRACTICE:0, 
    REQUESTED_FIRSTSHOT:1,
    SHOOTING_BARREL1:2,
    SHOOTING_BARREL2:3,
    AFTER_TARGET_PRACTICE:99 //not currently used
}

const FIRST_BARREL_LOCATION = [864, -3328, NaN];


const TUTORIAL_ENABLED = true;

//**********************
// UTIL (todo: move to different file)
//**********************
var first_then_after = (function(function1, function2) {
    var first = true;
    
    return (function() {
      if (first)
      {
        first = false;
        return function1();
      } else {
        return function2();
      }
    })
  });


// condition_fn:: promise_list :: list of arrow functions returning promises
function *conditional_promise_generator(promise_list, condition_fn){
    for(var i = 0; condition_fn() && i < promise_list.length; i++) {
        yield promise_list[i]();
    }
}



function inBoundingBox(x, y, left, right, top, bottom) {
    return (x > left && x < right && y < top && y > bottom);
}

var TUTORIAL_TEXT;
if (TUTORIAL_LANGUAGE == "DE") {
    TUTORIAL_TEXT = {
        HALL_INTRO : [
            "Hallo Soldat. Wir brauchen Ihre Hilfe. Unsere Einrichtung auf dem Planeten Mars wurde von Dämonen überrannt. Wir brauchen Sie, um die Bedrohung einzudämmen.",
            "Sie sind aktuell hier.",
            "In der Haupthalle. Lassen Sie mich Ihnen den Raum zeigen.",
            "Wenn sie durch den Raum laufen ",
            "werden sie feststellen, dass der Raum rechteckig ist",
            "Ihr Ziel ist es den Ausgang zu finden. Vorher sollten sie sich Ausrüstung aufzufüllen. . Sie werden sie brauchen.",
            "Hier finden sie einen Verbandskasten, um ihre Gesundheit aufzufüllen. Sie können es einsammeln indem sie durch es hindurch laufen."
        ],
        HALL_PICKEDUP_HEALTH_BONUS : [
            "Gut. Hier drüben",
            "ist der Übergang zur Waffenkammer. Dort wird es etwas Rüstung für sie geben. Versuchen sie an der Wand entlang zu laufen, um den Übergang zu finden."
        ],
        ARMORY_INTRO : [
            "Das ist die Waffenkammer. Eine Treppe",
            "führt zu einem Vorsprung wo sie Rüstung finden können.", //leed => phonetic for speech output
            "Sie können das mittlere Pedal jederzeit durchdrücken und halten um sich im Raum umzusehen. So lange sie es gedrückt halten werden Ihnen Dinge im Raum präsentiert. Sie können das Pedal jederzeit loslassen, um das aktuelle Objekt auszuwählen und zu verfolgen. Probieren sie es jetzt aus, indem sie das mittlere Pedal durchdrücken!"
        ],
        HALL_SHOOTPISTOL : [
            "Willkommen zurück in der Haupthalle. Ehe sie weiter tiefer in die Einrichtung vorstoßen, versichern sie sich, dass ihr Pistole funktioniert. Drücken sie das rechte Pedal um zu schießen."
        ],
        HALL_TARGET_PRACTICE : [
            "Gut, es sieht so aus, als funktioniert ihre Pistole. Zeit für ein paar Schießübungen.",
            "Hier ist ein explosives Fass. Sie können es anvisieren indem sie den Ich-Griff rotieren. Versuchen sie darauf zu schießen - es sollte nach zwei direkten Treffern explodieren."
        ],
        SURVEY : {
            YOU_ARE_IN : "Sie sind jetzt im ",
            PASSAGE_TO_ARMORY : "Der Übergang zur Waffenkammer ist hier.",
            PASSAGE_TO_GUARDPOST : "Der Übergang zum Wachposten ist hier",
            PASSAGE_TO_HALL : "Der Übergang zur Haupthalle ist hier.",
            STAIRS : "Die Treppe zum Vorsprung."
        }
        , ROOMS : {
            ARMORY : "Waffenkammer",
            MAINHALL : "Haupthalle",
            GUARDPOST : "Wachposten",
            TUNNEL : "Tunnel",
            BRIDGE : "Brücke",
            LOBBY : "Lobby",
            ELEVATOR : "Aufzug"
        },
        PICKUP : {
            HEALTH_BONUS: "Gesundheitsbonus",
            HEALTH_IS_NOW: "Aktuelle Gesundheit ist ",
            ARMOR_BONUS:  "Rüstungsbonus",
            ARMOR_IS_NOW: "Aktuelle Rüstung ist ",
            SET_OF_ARMOR: "eine Rüstung",         
            BULLETS: "Pistolenmunition",
            SHOTGUN_SHELLS: "Schrotflintenmunition"
     }
    };
} else if (TUTORIAL_LANGUAGE == "EN") {
    TUTORIAL_TEXT = {
        HALL_INTRO : [
            "Hello space marine. We need your help. Our facility on Mars has had an outbreak of demons. We need you to contain the threat.",
            "You are currently here.",
            "in the main hall. Let me show you around the room.",
            "If you walk around",
            "You will find the room is rectangular",
            "Your goal is to find the exit. Before you do, you better get some supplies. You'll need them.",
            "Here is a health bonus. You can pick it up by walking over it"
        ],
        HALL_PICKEDUP_HEALTH_BONUS : [
            "Good. Over here",
            "Is the passage to the armory. That will have some armor for you. Try following the wall to get to it."
        ],
        ARMORY_INTRO : [
            "This is the armory. Stairs",
            "leed up to a ledge with armor here", //leed => phonetic for speech output
            "You can press and hold the middle pedal anytime to look around the room. As long as you hold it, it will show you things in the room. You can let go at any point to track that object. Try it now by pressing and holding the middle pedal!"
        ],
        HALL_SHOOTPISTOL : [
            "Welcome back to the hall. Before you move on, let's make sure your pistol is working. Press the right pedal to shoot."
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
            STAIRS : "Stairs to ledge"
        },

        ROOMS : {
            ARMORY : "armory",
            MAINHALL : "main hall",
            GUARDPOST : "gardpost",
            TUNNEL : "tunnel",
            BRIDGE : "bridge",
            LOBBY : "lobby",
            ELEVATOR : "elevator"
        },

        PICKUP : {
            HEALTH_BONUS: "Health Bonus",
            HEALTH_IS_NOW: "Health is now ",
            ARMOR_BONUS:  "Armor Bonus",
            ARMOR_IS_NOW: "Armor is now ",
            SET_OF_ARMOR: "Set of Armor",         
            BULLETS: "Bullets",
            SHOTGUN_SHELLS: "Shotgun Shells"
     }
    }; 
}


function doomcoords2room(x, y) {
    var room = "";
    if (inBoundingBox(x, y, -303, 513, -3024, -3437)) {
        room = "armory";
    } else if (inBoundingBox(x, y, 720, 1327, -2900, -3663)) {
        room = "hall";     
    } else if (inBoundingBox(x, y, 1568, 2479, -2128, -2735)) {
        room = "gardpost";
    } else if (inBoundingBox(x, y, 2479, 2943, -2576, -2800)) {
        room = "cave";
    } else if (inBoundingBox(x, y, 2768, 3447, -2928, -3650)) {
        room = "bridge";
    } else if (inBoundingBox(x, y, 2704, 3311, -4048, -4591)) {
        room = "lobby";
    } else if (inBoundingBox(x, y, 2928, 3087, -4688, -4847)) {
        room = "elevator";
    }
    //todo add the secrets
    return room;
}


//**********************
// DoomTutorial object
//**********************


const last_N_bookmarks_length = 2; //size of buffer of bookmark names encountered

class DoomTutorial { 
    constructor() {

        //do we play tutorial segments?
        this._tutorial_enabled = TUTORIAL_ENABLED;
        
        //finite buffer of bookmark names encountered
        this.last_N_bookmarks = []; 

        //hashmap: [""] -> function, where keys are lists of last bookmark names to compare against, and functions are callbacks
        this.bookmark_triggers = {}; 

        //todo: put the DoomController into an object, pass to Doom Tutorial, make these functions part of that interface
        this.doomProcess = null;
        this.movePantoFunction = function(a,b) {console.log("ERROR: MovePantoFunction not set");};
        this.doomToPantoCoordFunction = function(a) {console.log("ERROR: doomToPantoCoordFunction not set");};
        this.player = null;
        this.playerlocation = "hall";
        this.ammo_dictionary = {
                'Bullets':50,
                'Shotgun Shells':0
        };
        this._target_practice_status = TARGET_PRACTICE_STATE.BEFORE_TARGET_PRACTICE;
        this.room_item_dictionary = {}; //dictionary of rooms to list of items
        this._initialize_pickup_functions();

        this.initializeTestTutorial();
    }

    run_script(promise_list) {
        this._running_script = true;
        var script_generator = conditional_promise_generator(promise_list, () => this._running_script);
        this.pauseDoom();
        co(script_generator)
        .catch(console.log)
        .then(() => this.resumeDoom());
    }

    _initialize_pickup_functions() {
        this._pickup_healthbonus = first_then_after(
            () => this.speakText("Health Bonus.")
                    .then(() => this.playSound("audio/collectHealth.wav"))
                    .then(()=> this.speakText("Health is now " + (this.player.health))),
            () => this.playSound('audio/collectHealth.wav')
                .then(()=> this.speakText(""+(this.player.health+1))));
            // () => this.speakText("Health " + (this.player.health+1)));

        this._pickup_armorbonus = first_then_after(
            ()=> this.speakText("Armor Bonus.")
                .then(() => this.playSound('audio/dswpnup_armor.wav'))
                .then(() => this.speakText("Armor is now " + (this.player.armor))),
            () => this.playSound('audio/dswpnup_armor.wav')
                .then(()=> this.speakText(""+(this.player.armor+1))));

        this._pickup_greenarmor = first_then_after(
            () => this.speakText("Set of Armor.")
                .then(() => this.playSound('audio/dswpnup_armor.wav'))
                .then(() => this.waitMS(100))
                .then(() => this.playSound('audio/dswpnup_armor.wav'))
                .then(() => this.speakText("Armor set to 100.")),
            // () => this.speakText("Green Armor 100"));
            () => this.playSound('audio/dswpnup_armor.wav')
                .then(()=> this.speakText("100")));

        this._pickup_bullets = first_then_after(
            () => this.speakText("Bullets. " + (this.ammo_dictionary['Bullets'])), 
            () => this.speakText("Bullets. " + (this.ammo_dictionary['Bullets'])));

        this._pickup_shotgun_shells = first_then_after(
            () => this.speakText("Shotgun Shells. " + (this.ammo_dictionary['Shotgun Shells'])), 
            () => this.speakText("Shotgun Shells. " + (this.ammo_dictionary['Shotgun Shells'])));
    }
    
    //todo: put the DoomController into an object, pass to Doom Tutorial, make these functions part of that interface
    setDoomProcess(newDoomProcess)
    {
        this.doomProcess = newDoomProcess;
    }

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

    handlePlayer(playerpacket) {
        this.player = Object.assign({}, playerpacket);
        var old_location = this.playerlocation;
        this.playerlocation = doomcoords2room(this.player.pos[0], this.player.pos[1]);
        if (old_location != this.playerlocation)
        {
            // this.speakText(this.playerlocation);
            // console.log(this.room_item_dictionary[this.playerlocation]);
        }
    }

    handleWeaponChange(weaponChangePacket) {
        console.log(weaponChangePacket);
        //this.ammo_dictionary
    }
    
    handleWeaponShot(weaponShotPacket) {
        // console.log(weaponShotPacket);
        this.ammo_dictionary[weaponShotPacket.ammotype] = weaponShotPacket.ammo[0];
        if(this._tutorial_enabled && (this._target_practice_status == TARGET_PRACTICE_STATE.REQUESTED_FIRSTSHOT))
        {
            this._target_practice_status = this._target_practice_status.SHOOTING_BARREL1;
            this.waitMS(500)
            .then(() => this.run_script([
                ()=> this.speakText(TUTORIAL_TEXT.HALL_TARGET_PRACTICE[0]),
                //move to explosive barrel 1
                () => this.movePantoTo(1, this.doomToPantoCoordFunction(FIRST_BARREL_LOCATION), 500),
                () => this.speakText(TUTORIAL_TEXT.HALL_TARGET_PRACTICE[1]),
                //after "you can aim at it": wiggle it handle? "Like so."
                () => this.resumeDoom()
            ]));   
        }
    }

    //"pickup" is actually triggered when an object is destroyed, we need to check if it is a pickup
    handlePickup(pickuppacket) {
        delete this.room_item_dictionary[this.playerlocation][""+pickuppacket.id];

        //handle triggers based on destroying something
        //TODO: UNFORTUNATELY barrels aren't destroyed in the same way, and don't call this trigger
        // if(pickuppacket.id == this._first_barrel_id
        //     && this._target_practice_status == TARGET_PRACTICE_STATE.SHOOTING_BARREL1
        //     && this._tutorial_enabled) {
        //     //TRIGGER NEXT STAGE OF THE TUTORIAL
        //     this._target_practice_status = TARGET_PRACTICE_STATE.SHOOTING_BARREL2;
        //     this.waitMS(500)
        //     .then(() => this.pauseDoom())
        //     .then(()=> this.speakText("Good shot! There are two more barrels in the room. You can look for them by pressing and holding the middle pedal. Hold the pedal until it is on a barrel, let go, and try to shoot it. Don't get too close!"))
        //     //move to explosive barrel 2
        //     .then(() => this.resumeDoom());
        // }

        
        //if it actually _is_ a pickup, then notify the user as needed
        if (this.player != null
            && Math.abs(this.player.pos[0] - pickuppacket.pos[0]) < PICKUP_EPSILON
            && Math.abs(this.player.pos[1] - pickuppacket.pos[1]) < PICKUP_EPSILON)
        {
            // console.log(pickuppacket)
            if(pickuppacket.class == "HealthBonus")
            {
                this._pickup_healthbonus()
                .then(() => {
                    if (this._tutorial_enabled && pickuppacket.pos[0] ==  736 && pickuppacket.pos[1] == -3520)
                    {
                        this.run_script([
                            () => this.speakText(TUTORIAL_TEXT.HALL_PICKEDUP_HEALTH_BONUS[0]),
                            () => this.movePantoTo(1, this.doomToPantoCoordFunction([770,-3221, NaN]), 250),
                            () => this.waitMS(250),
                            () => this.movePantoTo(1, this.doomToPantoCoordFunction([518,-3221, NaN]), 250),
                            () => this.waitMS(250),
                            () => this.speakText(TUTORIAL_TEXT.HALL_PICKEDUP_HEALTH_BONUS[1])
                        ]);   
                    } 
                });
            } else if (pickuppacket.class == "ArmorBonus") {
                this._pickup_armorbonus()
                .then( () => {
                    if(this._tutorial_enabled && pickuppacket.pos[0] ==  736 && pickuppacket.pos[1] == -3520)
                    {
                        this.run_script([
                            () => this.waitMS(250),
                            () => this.speakText("There are more supplies in the room. You can press the left foot pedal at any time to look around the current room."),
                            () => this.resumeDoom()
                        ]);
                    }
                });
            } else if (pickuppacket.class == "GreenArmor") {
                this._pickup_greenarmor();
            } else if (pickuppacket.class == "Bullets") {
                var amount_of_bullets = parseInt(pickuppacket.amount);
                this.ammo_dictionary['Bullets'] += amount_of_bullets;
                this._pickup_bullets();
            } else if (pickuppacket.class == "Shotgun Shells") {
                var amount_of_shotgunshells = parseInt(pickuppacket.amount);
                this.ammo_dictionary['Shotgun Shells'] += amount_of_shotgunshells; //TODO: there's a bug, the pickupevent is not always triggered on the first shotgun shells picked up
                this._pickup_shotgun_shells();
            }else {
                console.log("picked up '"+pickuppacket.class+"'");
            }   
        }


    }

    handleSpawn(spawnpacket) {
        var room = doomcoords2room(spawnpacket.pos[0], spawnpacket.pos[1]);
        // console.log("adding " + spawnpacket.class + " " + spawnpacket.id + " to room " + room);
        if (!(room in this.room_item_dictionary)) {
            this.room_item_dictionary[room] = {};
        }
        if (SIGHT_SURVEY_INCLUDE_CLASSES.includes(spawnpacket.class))
        {
            this.room_item_dictionary[room][spawnpacket.id] = spawnpacket;
        }

        //handle special barrel triggers
        if (room == "hall"
            && spawnpacket.class == "ExplosiveBarrel"
            && Math.abs(spawnpacket.pos[0] - FIRST_BARREL_LOCATION[0]) < PICKUP_EPSILON
            && Math.abs(spawnpacket.pos[1] - FIRST_BARREL_LOCATION[1]) < PICKUP_EPSILON) {
                this._first_barrel_id = spawnpacket.id;
        }
    }

    handlePlayerSpawn(spawnpacket) {
            // console.log(spawnpacket); //dev + debug
            
            // this.pauseDoom();
            this.run_script([
                () => this.speakText(TUTORIAL_TEXT.HALL_INTRO[0]),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.HALL_INTRO[1]),
                () => this.movePantoTo(0, this.doomToPantoCoordFunction(spawnpacket.pos), 500),
                () => this.waitMS(500),
                () => this.speakText(TUTORIAL_TEXT.HALL_INTRO[2]),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction(spawnpacket.pos), 500),
                () => this.speakText(TUTORIAL_TEXT.HALL_INTRO[3]),
                () => this.speakText(TUTORIAL_TEXT.HALL_INTRO[4]),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([784,-3500, NaN]), 500),
                () => this.waitMS(500),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([784,-3016, NaN]), 500),
                () => this.waitMS(500),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([1298,-3016, NaN]), 500),
                () => this.waitMS(500),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([1298,-3500, NaN]), 500),
                () => this.waitMS(500),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction(spawnpacket.pos), 500),
                () => this.waitMS(500),
                // () => this.movePantoTo(1, this.doomToPantoCoordFunction([NaN,NaN,NaN])),
                () => this.speakText(TUTORIAL_TEXT.HALL_INTRO[5]),
                () => this.movePantoTo(1, this.doomToPantoCoordFunction([761,-3530,NaN]), 250),
                () => this.waitMS(250),
                () => this.speakText(TUTORIAL_TEXT.HALL_INTRO[6]),
                ()=> this.resumeDoom()
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
        // console.log(keypresspacket.keyCode);
        if(keypresspacket.keyCode == 11) //38 == "j", use for sight survey; 11=='b', sight survey debug
        {
            if(keypresspacket.event == "EV_KeyDown")
            {
                this.startSightSurvey();
            } else if (keypresspacket.event == "EV_KeyUp")
            {
                this.stopSightSurvey();
            }
        } else if  (keypresspacket.keyCode == 8) { //8 == 'c' for shooting
            this._running_script = false;
            say.stop();
        } else {
            // console.log(keypresspacket.keyCode);
        }
    }

    speakText(txt) {
        var speak_voice = "Tom";
        if (TUTORIAL_LANGUAGE == "DE") {
            speak_voice = "Markus";
        }
        return say.speak(txt, speak_voice, 2.0, (err) => {
            if(err) {
                console.error(err);
                return;
            }
        });
    }

    playSound(filename) {
        return new Promise(function(resolve, reject) {
            PlaySound.play(filename, function(err) {
                if (err){
                    console.error(err);
                }});
                resolve(); //this should be resolve(resolve); I think
        });
    }

    waitMS(ms) {
        return new Promise(resolve => setTimeout(() => resolve(resolve), ms));
    }

    setDoomPause(b)
    {
        if(this.doomProcess == null)
        {
            console.log("ERROR: DoomTutorial's doomProcess isn't initialized. Cannot (un)pause.");
        } else {
            if (b)
            {
                this.doomProcess.stdin.write("PAUSE 0\n"); //set pause to true
                if (this.player)
                {
                    this.movePantoFunction(0, this.doomToPantoCoordFunction(this.player.pos), 100);
                }
            } else {
                this.doomProcess.stdin.write("PAUSE 1\n"); //set pause to false;
            }
            
        }
    }

    pauseDoom() {this.setDoomPause(true);}
    resumeDoom() {this.setDoomPause(false);}
    

    initializeTestTutorial() {
        if(this._tutorial_enabled)
        {
            this.addBookmarkTrigger(
                ["exit hall to armory", "ENTER ARMORY"],
                first_then_after(
                    ()=> this.run_script([
                            () => this.speakText(TUTORIAL_TEXT.ARMORY_INTRO[0]),
                            () => this.movePantoTo(1, this.doomToPantoCoordFunction([354,-3220, NaN]), 500),
                            () => this.waitMS(500),
                            () => this.movePantoTo(1, this.doomToPantoCoordFunction([122,-3220, NaN]), 500, TWEEN.Easing.Linear.None),
                            () => this.waitMS(500),
                            () => this.speakText(TUTORIAL_TEXT.ARMORY_INTRO[1]),
                            () => this.movePantoTo(1, this.doomToPantoCoordFunction([-210,-3220, NaN]), 500),
                            () => this.waitMS(500),
                            () => this.speakText(TUTORIAL_TEXT.ARMORY_INTRO[2]),
                            () => this.resumeDoom(),
                    ]),
                    ()=> {
                        this.speakText("Armory");
                    }));

            this.addBookmarkTrigger(
                ["ENTER ARMORY","exit hall to armory"],
                first_then_after(
                    ()=> {
                        this.run_script([
                            () => this.speakText(TUTORIAL_TEXT.HALL_SHOOTPISTOL[0]),
                            () => this.resumeDoom()
                        ]);
                        this._target_practice_status = TARGET_PRACTICE_STATE.REQUESTED_FIRSTSHOT;
                    },
                    ()=> {
                        this.speakText("Hall");
                    }));
            }
    }


    //**************************
    // SIGHT SURVEY
    //**************************
    stopSightSurvey() {
        this._running_sight_survey = false;
        this.resumeDoom();
    }

    _ifRunningSightSurvey(fn) {
        if (this._running_sight_survey)
        {
            return fn();
        } else {
            return reject("No longer running sight survey");
        }
    }

    startSightSurvey() {
        if(!this._running_sight_survey)
        {
            var room = this.playerlocation;
            var items_to_survey = this.room_item_dictionary[this.playerlocation];
            this._running_sight_survey = true;


            var bonuses_to_survey = [];
            var greenarmors_to_survey = [];

            for (var item in items_to_survey) {
                // console.log("item: " + item);
                if(items_to_survey[item].class == "GreenArmor")
                {
                    greenarmors_to_survey.push(items_to_survey[item])
                } else if (items_to_survey[item].class == "HealthBonus") {
                    bonuses_to_survey.push(items_to_survey[item])
                } else if (items_to_survey[item].class == "ArmorBonus") {
                    bonuses_to_survey.push(items_to_survey[item])
                } else if (items_to_survey[item].class == "ExplosiveBarrel") {
                    bonuses_to_survey.push(items_to_survey[item])
                }
            }

            this.pauseDoom();
            var displayPromise = this.speakText(TUTORIAL_TEXT.SURVEY.YOU_ARE_IN + room);

            //landmarks
            if (room == "armory") {
                displayPromise = displayPromise.then(() => this._ifRunningSightSurvey(
                    () => this.movePantoFunction(1, this.doomToPantoCoordFunction([518,-3221, NaN]), 250)))
                .then(() => this._ifRunningSightSurvey(
                    () =>  this.speakText(TUTORIAL_TEXT.SURVEY.PASSAGE_TO_HALL)))
                // .then(() => this.waitMS(250))
                .then(() => this._ifRunningSightSurvey(
                    () => this.movePantoFunction(1, this.doomToPantoCoordFunction([354,-3220, NaN]), 250)))
                .then(() => this.waitMS(250))
                .then(() => this._ifRunningSightSurvey(
                    () => this.movePantoFunction(1, this.doomToPantoCoordFunction([122,-3220, NaN]), 750, TWEEN.Easing.Linear.None)))
                .then(() => this._ifRunningSightSurvey(
                    () =>  this.speakText(TUTORIAL_TEXT.SURVEY.STAIRS)))
                .then(() => this.waitMS(500));
        //*******
        // Armory
        //*******
        } else if (room == "hall") {
            displayPromise = displayPromise.then(() => this._ifRunningSightSurvey(
                () => this.movePantoFunction(1, this.doomToPantoCoordFunction([518,-3221, NaN]), 500)))
            .then(() => this._ifRunningSightSurvey(
                () =>  this.speakText(TUTORIAL_TEXT.SURVEY.PASSAGE_TO_ARMORY)))
            // .then(() => this.waitMS(250))
            .then(() => this._ifRunningSightSurvey(
                () => this.movePantoFunction(1, this.doomToPantoCoordFunction([1272,-2906, NaN]), 500)))
            // .then(() => this.waitMS(350))
            .then(() => this._ifRunningSightSurvey(
                () =>  this.speakText(TUTORIAL_TEXT.SURVEY.PASSAGE_TO_GUARDPOST))) //phonetic for speech output
            .then(() => this._ifRunningSightSurvey(
                () => this.movePantoFunction(1, this.doomToPantoCoordFunction([1272,-2559, NaN]), 500, TWEEN.Easing.Linear.None)))
            .then(() => this.waitMS(500)) 
            .then(() => this._ifRunningSightSurvey(
                () => this.movePantoFunction(1, this.doomToPantoCoordFunction([1518,-2490, NaN]), 350, TWEEN.Easing.Linear.None)))
            .then(() => this.waitMS(750));
        }
            
            //Green armor, if it's in the room
            for(var greenarmor in greenarmors_to_survey)
            {
                if (greenarmors_to_survey.hasOwnProperty(greenarmor)) {           
                    displayPromise = displayPromise.then( () => this._ifRunningSightSurvey(
                        () => {
                            this.movePantoFunction(1, this.doomToPantoCoordFunction(greenarmors_to_survey[greenarmor].pos), 250);
                            this.speakText(greenarmors_to_survey[greenarmor].class);
                        }
                        ))
                        .then(() => this.waitMS(750));
                }   
            }


            //Armor and health bonuses, if they are in the room
            //TODO: use this structure if you can figure out the scoping rules
            //  Object.keys(a).forEach((value) => console.log(value))
            //  bonuses_to_survey.forEach((bonusName,) => {})
            for(var bonus in bonuses_to_survey)
            {
                    if (bonuses_to_survey.hasOwnProperty(bonus)) {           
                        var executeNow = ((bonusName) => {
                            displayPromise = displayPromise.then( () => this._ifRunningSightSurvey(
                                () => {
                                    this.movePantoFunction(1, this.doomToPantoCoordFunction(bonuses_to_survey[bonusName].pos), 250);
                                    if(bonuses_to_survey[bonusName].class == "ArmorBonus")
                                    {
                                        this.playSound('audio/dswpnup_armor.wav');
                                    } else if (bonuses_to_survey[bonusName].class == "HealthBonus")
                                    {
                                        this.playSound('audio/collectHealth.wav');
                                    } else {
                                        this.speakText(""+bonuses_to_survey[bonusName].class);
                                    }
                                }))
                                .then(() => this.waitMS(500));
                            });
                        executeNow(bonus);
                        }
            }
            //After rooms, display player health, armor, ammo, and help menu --> offer to reset 

            displayPromise = displayPromise.catch( () => null);
        }
    }

};



module.exports = DoomTutorial;
