'use strict';

const EventEmitter = require('events').EventEmitter;
const say = require('say');
const VoiceCommand = require('../utils/voiceCommand');
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
        switch (process.platform) {
          case 'darwin':
            voice = this.getMacOsVoiceForLanguage(language);
            break;
          case 'win32':
            voice = this.getWindowsVoiceForLanguage(language);
            break;
          default:
            voice = 'voice_kal_diphone';
            break;
        }
      }
      this.emit('saySpeak', txt);
      say.speak(txt, voice, speed, (err) => {
        if (err) {
          console.error(err);
          resolve(resolve);
        }
        resolve(resolve);
      });
    });
  }

  /**
   * @description Selects the default voice for Windows based on a language.
   * @param {string} language - The language to be spoken.
   * @return {string} Returns the default voice for the language.
   */
  getWindowsVoiceForLanguage(language) {
    switch (language) {
      case 'EN':
        return 'Microsoft Zira Desktop';
        break;
      default:
        return 'Microsoft Hedda Desktop';
        break;
    }
  }

  /**
   * @description Selects the default voice for MacOS based on a language.
   * @param {string} language - The language to be spoken.
   * @return {string} Returns the default voice for the language.
   */
  getMacOsVoiceForLanguage(language) {
    switch (language) {
      case 'EN':
        return 'Alex';
        break;
      default:
        return 'Anna';
        break;
    }
  }

  /**
   * @description Speaks a text asynchronously.
   * @param {string} txt - The text to speak.
   * @param {string} [language=DE] - The language to speak.
   * @param {number} [speed=1.4] - The speed that is spoken with.
   * @param {string} voice - The voice that is spoken with.
   * When this parameter specified, the language parameter is ignored.
   */
  speakTextAsync(txt, language = 'DE', speed = 1.4, voice) {
    if (voice === undefined) {
      switch (process.platform) {
        case 'darwin':
          voice = this.getMacOsVoiceForLanguage(language);
          break;
        case 'win32':
          voice = this.getWindowsVoiceForLanguage(language);
          break;
        default:
          voice = 'voice_kal_diphone';
          break;
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
