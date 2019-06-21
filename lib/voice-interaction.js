'use strict';

const EventEmitter = require('events').EventEmitter;
const say = require('say-promise');
const VoiceCommand = require('../voice-command');
const Player = require('./player');

/**
 * @description Class for voice input and output.
 * @extends EventEmitter
 */
class VoiceInteraction extends EventEmitter {
  /**
   * @description Creates a VoiceInteraction object.
   */
  constructor() {
    super();
    this.voiceCommand;
  }
  /**
   * @description Speaks a text.
   * @param {string} txt - The text to speak.
   * @param {string} [language=DE] - The language to speak.
   * @param {number} [speed=1.4] - The speed that is spoken with.
   * @param {string} voice - The voice that is spoken with.
   * When this parameter specified, the language parameter is ignored.
   * @return {Promise} Returns a promise for the speech output.
   */
  speakText(txt, language = 'DE', speed = 1.4, voice) {
    let speakVoice = voice || 'Anna';
    if (voice === undefined && language == 'EN') {
      speakVoice = 'Alex';
    }
    this.emit('saySpeak', txt);
    return say.speak(txt, speakVoice, speed, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  }
  /**
   * @description Creates a script which speaks a german text with 1.4 speed.
   * @param {string} txt - The text to speak.
   */
  sayText(txt) {
    this.runScript([
      () => this.speakText(txt)
    ]);
  }

  /**
   * @description Play a soundfile.
   * @param {string} filename - The file to play.
   * @param {boolean} [loop=false] - If the sound should loop.
   * @return {Player} The player playing the sound.
   */
  playSound(filename, loop = false) {
    return new Player(filename, loop);
  }

  /**
   * @description Sets up the voice input listener.
   * @param {Array} commands - List of Strings to listen for.
   */
  setCommands(commands) {
    this.voiceCommand = new VoiceCommand(commands);
    this.voiceCommand.on('command', function(command) {
      console.log('Keyword Recognized: ', command);
      this.emit('keywordRecognized', command);
    }.bind(this));
  }

  /**
   * @description Starts the listener.
   * @return {Promise} Instantly resolving promise for compability.
   */
  beginListening() {
    return new Promise((resolve) => {
      this.voiceCommand.startListening();
      resolve(resolve);
    });
  }
  /**
   * @description Stops the listener.
   * @return {Promise} Instantly resolving promise for compability.
   */
  haltListening() {
    return new Promise((resolve) => {
      this.voiceCommand.stopListening();
      resolve(resolve);
    });
  }
}

module.exports = VoiceInteraction;
