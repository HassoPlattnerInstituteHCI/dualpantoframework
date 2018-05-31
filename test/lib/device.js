'use strict';

/* eslint-disable global-require, max-nested-callbacks */

const test = require('ava');

require('../../Framework');
const Broker = require('../../lib/broker');
const Device = require('../../lib/device');

const broker = new Broker({visualDebugger: false});
const device = broker.createVirtualDevice();

test('constructor', t => {
	t.is(device.constructor, Device);

	t.is(device.port, 'virtual0');
});

test('handleMoved', t => {
	t.true(typeof device.handleMoved === 'function');
});

test('moveHandleTo', t => {
	t.true(typeof device.moveHandleTo === 'function');
});

test('applyForceTo', t => {
	t.true(typeof device.applyForceTo === 'function');
});

test('movePantoTo', t => {
	t.true(typeof device.movePantoTo === 'function');
});

test('unblockHandle', t => {
	t.true(typeof device.unblockHandle === 'function');
});

test('unblock', t => {
	t.true(typeof device.unblock === 'function');
});

test('tweenPantoTo', t => {
	t.true(typeof device.tweenPantoTo === 'function');
});
