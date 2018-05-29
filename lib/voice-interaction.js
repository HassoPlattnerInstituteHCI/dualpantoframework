'use strict';

const EventEmitter = require('events');
const say = require('say-promise');
const VoiceCommand = require('../voice-command');

/**
 * Class for voice input and output
 * @extends EventEmitter
 *
 */
class VoiceInteraction extends EventEmitter {
	/**
	 * Create a VoiceInteraction object.
	 */
	constructor() {
		super();
		this.voiceCommand = null;
	}

	/**
	 * Speaks a text.
	 * @param {string} txt - The text to speak.
	 * @param {string} [language=DE] - The language to speak.
	 * @param {number} [speed=1.4] - The speed that is spoken with.
	 * @returns {undefined} Currenlty nothing is returned
	 * @example
	 * await VoiceInteraction.speakText('Hallo Welt!');
	 * await VoiceInteraction.speakText('Hello World', 'EN', 1.3);
	 */
	speakText(txt, language = 'DE', speed = 1.4) {
		let speakVoice = 'Anna';
		if(language === 'EN')
			speakVoice = 'Alex';

		this.emit('saySpeak', txt);
		return say.speak(txt, speakVoice, speed, err => {
			if(err)
				console.error(err);
		});
	}

	/**
	 * Creates a script which speaks a german text with 1.4 speed.
	 * @deprecated **Use {@link VoiceInteraction#speakText} instead!**
	 * @param {string} txt - The text to speak.
	 * @private
	 */
	sayText(txt) {
		this.run_script([() => this.speakText(txt)]);
	}

	// eslint-disable-next-line class-methods-use-this
	playSound() {
		console.log('play sound is not implemented yet');
	}

	/**
	 * Sets up the voice input listener.
	 * @param {array} commands - List of Strings to listen for.
	 * @example
	 * VoiceInteraction.setCommands(['Hotels']);
	 */
	setCommands(commands) {
		this.voiceCommand = new VoiceCommand(commands);
		this.voiceCommand.on('command', command => {
			console.log('Keyword Recognized: ', command);
			this.emit('keywordRecognized', command);
		});
	}

	/**
	 * starts the listener.
	 * @returns {Promise} An already resolved promise
	 * @example
	 * await VoiceInteraction.beginListening();
	 */
	beginListening() {
		return new Promise(resolve => {
			this.voiceCommand.startListening();
			resolve(resolve);
		});
	}

	/**
	 * stops the listener.
	 * @returns {Promise} An already resolved promise
	 * @example
	 * await VoiceInteraction.haltListening();
	 */
	haltListening() {
		return new Promise(resolve => {
			this.voiceCommand.stopListening();
			resolve(resolve);
		});
	}
}

module.exports = VoiceInteraction;
