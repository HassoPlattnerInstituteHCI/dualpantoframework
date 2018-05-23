'use strict';

const EventEmitter = require('events').EventEmitter,
      say = require('say-promise'),
      VoiceCommand = require('../voice-command');

/** Class for voice input and output
* @extends EventEmitter
*/
class VoiceInteraction extends EventEmitter{
  /**
  * Create a Voiceinteraction object.
  */
  constructor(){
    super();
    this.voiceCommand;
  }
  /**
   * Speaks a text.
   * @param {String} txt - The text to speak.
   * @param {String} [language=DE] - The language to speak.
   * @param {number} [speed=1.4] - The speed that is spoken with.
   */
  speakText(txt, language = 'DE', speed = 1.4) {
      var speak_voice = "Anna";
      if (language == "EN") {
          speak_voice = "Alex";
      }
      this.emit('saySpeak', txt);
      return say.speak(txt, speak_voice, speed, (err) => {
          if(err) {
              console.error(err);
              return;
          }
      });
    }
    /**
     * Creates a script which speaks a german text with 1.4 speed.
     * @param {String} txt - The text to speak.
     */
    sayText(txt) {
      this.run_script([
        () => this.speakText(txt)
      ]);
    }

    playSound(filename) {
      console.log('play sound is not implemented yet');
    }

    /**
     * Sets up the voice input listener.
     * @param {array} commands - List of Strings to listen for.
     */
    setCommands(commands){
      this.voiceCommand = new VoiceCommand(commands);
      this.voiceCommand.on('command', function(command) {
        console.log('Keyword Recognized: ',command);
        this.emit('keywordRecognized', command);
      }.bind(this));
    }
    /**
     * starts the listener.
     */
    beginListening(){
      return new Promise (resolve =>
      {
        this.voiceCommand.startListening();
        resolve(resolve);
      });
    }
    /**
     * stops the listener.
     */
    haltListening(){
      return new Promise (resolve =>
      {
        this.voiceCommand.stopListening();
        resolve(resolve);
      });
    }
}

module.exports = VoiceInteraction;
