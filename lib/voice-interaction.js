'use strict';

const EventEmitter = require('events');
const say = require('say');
const VoiceCommand = require('../voice-command');
const Player = require('./player');
const {deprecated} = require('./util');

const voices = Object.assign(Object.create(null), {
	DE: 'Anna',
	EN: 'Alex',
});

const sayAsync = (text, speakVoice, speed) => new Promise((resolve, reject) => {
	say.speak(text, speakVoice, speed, err => {
		if(err)
			reject(err);
		else
			resolve(text);
	});
});

/**
 * Returns the name of an event for a given keyword.
 * @param {string} keyword the keyword
 * @returns {string} the event name
 * @memberof VoiceInteraction
 * @private
 */
const keywordEvent = keyword => `keywordRecognized:${keyword}`;

/**
 * Class for voice input and output.
 * @param {Broker} [broker]
 */
/**
 * @prop {Broker} [broker] the associated broker
 * @prop {Object} voiceCommand the voice command instance (used internaly)
 * @private
 */
class VoiceInteraction extends EventEmitter {
	/**
	 * Create a VoiceInteraction object.
	 * @param {Broker} [broker] the asociated broker
	 */
	constructor(broker = null) {
		super();
		this.broker = broker;
		this.voiceCommand = null;
	}

	/**
	 * Speaks a text.
	 * @param {string} text the text to speak
	 * @param {string} [language=DE] the language to speak
	 * @param {number} [speed=1.4] the speed that is spoken with
	 * @example
	 * await VoiceInteraction.speakText('Hallo Welt!');
	 * await VoiceInteraction.speakText('Hello World', 'EN', 1.3);
	 */
	async speakText(text, language = 'DE', speed = 1.4) {
		const speakVoice = voices[language];
		if(!speakVoice)
			throw new Error(`unknown language: ${language}`);

		this.emit('saySpeak', text);
		await sayAsync(text, speakVoice, speed);
	}

	/**
	 * Speaks a text. Same as {@link VoiceInteraction#speakText}.
	 * @deprecated **Use {@link VoiceInteraction#speakText} instead!**
	 * @param {string} text The text to speak.
	 * @private
	 */
	async sayText(text) {
		deprecated('voiceInteraction.sayText(text)', 'voiceInteraction.speakText(text)');
		await this.speakText(text);
	}

	/**
	 * Play a soundfile.
	 * @param {string} filename The file to play.
	 * @returns {Player} The player playing the sound
	 */
	// eslint-disable-next-line class-methods-use-this
	playSound(filename) {
		return new Player(filename);
	}

	/**
	 * Sets up the voice input listener.
	 * @param {array} commands List of Strings to listen for.
	 * @example
	 * VoiceInteraction.setCommands(['Hotels']);
	 */
	setCommands(commands) {
		if(this.voiceCommand !== null)
			throw new Error('commands already set');
		this.voiceCommand = new VoiceCommand(commands);
		this.voiceCommand.on('command', command => {
			this.handleCommand(command);
		});
	}

	handleCommand(command) {
		let handled = false;
		if(this.emit('keywordRecognized', command))
			handled = true;
		if(this.emit(keywordEvent(command), command))
			handled = true;
		if(this.broker) {
			for(const device of this.broker.devices) {
				if(device.emit('keywordRecognized', command))
					handled = true;
				if(device.emit(keywordEvent(command), command))
					handled = true;
			}
		}
		if(!handled)
			console.log('voice interaction: keywordRecognized:', command);
	}

	/**
	 * Starts the listener.
	 * @example
	 * VoiceInteraction.beginListening();
	 */
	beginListening() {
		this.voiceCommand.startListening();
	}

	/**
	 * Stops the listener.
	 * @example
	 * VoiceInteraction.haltListening();
	 */
	haltListening() {
		this.voiceCommand.stopListening();
	}
}

VoiceInteraction.keywordEvent = keywordEvent;

module.exports = VoiceInteraction;
