'use strict';

/* eslint-disable global-require, max-nested-callbacks */

const test = require('ava');

const VoiceInteraction = require('../../lib/voice-interaction');
const voiceInteraction = new VoiceInteraction();

test('constructor', t => {
	t.is(voiceInteraction.constructor, VoiceInteraction);
});

test('speakText', t => {
	t.true(typeof voiceInteraction.speakText === 'function');
});

test('sayText', t => {
	t.true(typeof voiceInteraction.sayText === 'function');
});

test('playSound', t => {
	t.true(typeof voiceInteraction.playSound === 'function');
});

test('setCommands', t => {
	t.true(typeof voiceInteraction.setCommands === 'function');
});

test('beginListening', t => {
	t.true(typeof voiceInteraction.beginListening === 'function');
});

test('haltListening', t => {
	t.true(typeof voiceInteraction.haltListening === 'function');
});
