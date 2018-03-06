'use strict';

const say = require('say-promise');

//**********************
// UTIL (todo: move to different file)
//**********************
var first_then_after = (function(function1, function2) {
    var first = true;
    
    return (function() {
      if (first)
      {
        first = false;
        function1();
      } else {
        function2();
      }
    })
  });


function inBoundingBox(x, y, left, right, top, bottom) {
    return (x > left && x < right && y < top && y > bottom);
}

function doomcoords2room(x, y) {
    var room = "";

    if (inBoundingBox(x, y, -303, 513, -3024, -3437)) {
        room = "armory";
    } else if (inBoundingBox(x, y, 720, 1327, -2900, -3663)) {
        room = "hall";     
    } else if (inBoundingBox(x, y, 1568, 2479, -2128, -2735)) {
        room = "guardpost";
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
}


//**********************
// DoomTutorial object
//**********************


const last_N_bookmarks_length = 2; //size of buffer of bookmark names encountered

class DoomTutorial { 
    constructor() {

        //finite buffer of bookmark names encountered
        this.last_N_bookmarks = []; 

        //hashmap: [""] -> function, where keys are lists of last bookmark names to compare against, and functions are callbacks
        this.bookmark_triggers = {}; 

        //todo: put the DoomController into an object, pass to Doom Tutorial, make these functions part of that interface
        this.doomProcess = null;
        this.movePantoFunction = function(a,b) {console.log("ERROR: MovePantoFunction not set");};
        this.doomToPantoCoordFunction = function(a) {console.log("ERROR: doomToPantoCoordFunction not set");};


        this.initializeTestTutorial();
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

    setDoomToPantoCoordFunction(new_doomToPantoCoordFunction)
    {
        this.doomToPantoCoordFunction = new_doomToPantoCoordFunction;
    }

    addBookmarkTrigger(key, fn) {
        this.bookmark_triggers[String(key)] = fn;
    }


    handlePlayerSpawn(spawnpacket) {
            console.log(spawnpacket); //dev + debug
            
            this.pauseDoom();
            this.speakText("Hello space marine. We need your help. Our facility on Mars has had an outbreak of demons. We need you to contain the threat.")
            .then(() => this.waitMS(500))
            .then(() => this.speakText("You are currently here."))
            .then(() => this.movePantoFunction(0, this.doomToPantoCoordFunction(spawnpacket.pos, 500)))
            .then(() => this.waitMS(500))
            .then(() => this.speakText("in the main hall. Let me show you around the room."))
            .then(() => this.movePantoFunction(1, this.doomToPantoCoordFunction(spawnpacket.pos, 500)))
            .then(() => this.speakText("If you walk around,"))
            .then(() => this.speakText("You will find the room is rectangular."))
            .then(() => this.movePantoFunction(1, this.doomToPantoCoordFunction([784,-3500, NaN], 500)))
            .then(() => this.waitMS(500))
            .then(() => this.movePantoFunction(1, this.doomToPantoCoordFunction([784,-3016, NaN], 500)))
            .then(() => this.waitMS(500))
            .then(() => this.movePantoFunction(1, this.doomToPantoCoordFunction([1298,-3016, NaN], 500)))
            .then(() => this.waitMS(500))
            .then(() => this.movePantoFunction(1, this.doomToPantoCoordFunction([1298,-3500, NaN], 500)))
            .then(() => this.waitMS(500))
            // .then(() => this.movePantoFunction(1, this.doomToPantoCoordFunction([NaN,NaN,NaN])))
            .then(() => this.speakText("Your goal is to find the exit. Before you do, you better get some supplies. You'll need them."))
            .then(() => this.movePantoFunction(1, this.doomToPantoCoordFunction([761,-3530,NaN, 250])))
            .then(() => this.waitMS(250))
            .then(() => this.speakText("Here is a health bonus. You can pick it up by walking over it."))
            .then(()=> this.resumeDoom());
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

    speakText(txt) {
        return say.speak(txt, 'Tom', 2.0, (err) => {
            if(err) {
                console.error(err);
                return;
            }
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
            } else {
                this.doomProcess.stdin.write("PAUSE 1\n"); //set pause to false;
            }
            
        }
    }

    pauseDoom() {this.setDoomPause(true);}
    resumeDoom() {this.setDoomPause(false);}
    

    initializeTestTutorial() {
        this.addBookmarkTrigger(
            ["exit hall to armory", "ENTER ARMORY"],
            first_then_after(
                ()=> {
                    this.pauseDoom();
                    this.speakText("This is the armory. Stairs lead to armor here and here.")
                    .then(() => this.resumeDoom());
                    
                },
                ()=> {
                    this.speakText("Armory");
                }));

        this.addBookmarkTrigger(
            ["ENTER ARMORY","exit hall to armory"],
            first_then_after(
                ()=> {
                    this.pauseDoom();
                    this.speakText("Welcome back to the hall. Let's try some target practice.")
                    .then(() => this.resumeDoom());
                },
                ()=> {
                    this.speakText("Hall");
                }));

        this.addBookmarkTrigger(
            ["armor armory"],
            first_then_after(
                ()=> {
                    this.pauseDoom();
                    this.speakText("This is a set of armor - it sets your armor to a full 100.")
                    .then(() => this.resumeDoom());
                },
                ()=> {}));

        this.addBookmarkTrigger(
            ["health bonus hall left"],
            first_then_after(
                ()=> {
                    this.pauseDoom();
                    this.speakText("Your health is now 101. Over here")
                    .then(() => this.movePantoFunction(1, this.doomToPantoCoordFunction([770,-3221], 250)))
                    .then(() => this.waitMS(250))
                    .then(() => this.movePantoFunction(1, this.doomToPantoCoordFunction([518,-3221], 250)))
                    .then(() => this.waitMS(250))
                    .then(() => this.speakText("Is the passage to the armory. That will have some armor for you. Try following the wall to get to it."))
                    .then(()=> this.resumeDoom());
                },
                ()=> {}));

    }

};



module.exports = DoomTutorial;
