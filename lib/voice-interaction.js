'use strict';

const EventEmitter = require('events').EventEmitter;
const say = require('say');
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
    return new Promise((resolve) => {
      if (voice === undefined) {
        switch (language) {
          case 'EN':
            voice = 'Alex';
            break;
          default:
            voice = 'Anna';
        }
      }
      this.emit('saySpeak', txt);
      say.speak(txt, voice, speed, (err) => {
        if (err) {
          console.error(err);
        }
        resolve(resolve);
      });
    });
  }

  /**
   * @description Speaks a text async.
   * @param {string} txt - The text to speak.
   * @param {string} [language=DE] - The language to speak.
   * @param {number} [speed=1.4] - The speed that is spoken with.
   * @param {string} voice - The voice that is spoken with.
   * When this parameter specified, the language parameter is ignored.
   */
  speakTextAsync(txt, language = 'DE', speed = 1.4, voice) {
    if (voice === undefined) {
      switch (language) {
        case 'EN':
          voice = 'Alex';
          break;
        default:
          voice = 'Anna';
      }
    }
    this.emit('saySpeak', txt);
    say.speak(txt, voice, speed, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  /**
   * @description Stops the speech output.
   */
  stopSay() {
    say.stop((err) => {
      if (err) {
        return console.error('unable to stop speech', err);
      };
    });
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
