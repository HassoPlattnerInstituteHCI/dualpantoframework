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

        this.doomProcess = null;

        this.initializeTestTutorial();
    }
    
    setDoomProcess(newDoomProcess)
    {
        this.doomProcess = newDoomProcess;
    }

    addBookmarkTrigger(key, fn) {
        this.bookmark_triggers[String(key)] = fn;
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
        return say.speak(txt, 'Alex', 1.0, (err) => {
            if(err) {
                console.error(err);
                return;
            }
        });
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
    }

};



module.exports = DoomTutorial;
