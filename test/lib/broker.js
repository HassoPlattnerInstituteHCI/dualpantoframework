'use strict';

/* eslint-disable global-require, max-nested-callbacks */

const test = require('ava');

const DualPantoFramework = require('../../Framework');

const Broker = require('../../lib/broker');
const VoiceInteraction = require('../../lib/voice-interaction');

const broker = new Broker({
	visualDebugger: false,
	deviceAutodetection: false,
});

test('constructor', t => {
	t.is(DualPantoFramework.constructor, Broker);
	t.is(broker.constructor, Broker);

	t.deepEqual(broker.deviceMap, new Map());
	t.is(broker.disconnectTimeout, 5);
	t.is(broker.voiceInteraction.constructor, VoiceInteraction);
});

const delay = () => new Promise(r => setTimeout(r, 10));
test('run_script', async t => {
	t.true(typeof DualPantoFramework.run_script === 'function');
	await new Promise(resolve => {
		DualPantoFramework.run_script([
			() => delay(),
			() => {
				resolve();
				return delay();
			},
		]);
	});
});

test('waitMS', async t => {
	t.true(typeof DualPantoFramework.waitMS === 'function');
	t.true(await (async () => {
		await DualPantoFramework.waitMS(10);
		return true;
	})());
});

test('getDevices', t => {
	t.true(typeof DualPantoFramework.getDevices === 'function');
	for(const device of DualPantoFramework.getDevices())
		t.fail(`contains a device: ${device}`);
});
