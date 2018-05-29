'use strict';

// entry file, exported as 'the framwork'

const {CI} = process.env;

const SerialPort = require('serialport');
const usb = CI ? null : require('usb');

const Device = require('./device');

const {broker} = require('./shared');

/**
 * The shared broker.
 * @name DualPantoFramework
 * @type {Broker}
 * @param {VoiceInteraction} voiceInteraction - shared voice interaction instance
 * @example
 * const DualPantoFramework = require('dualpantoframework');
 * const VoiceInteraction = DualPantoFramework.voiceInteraction;
 */
module.exports = broker;

if(process.env.NODE_ENV !== 'test') {
	// require async to dirty fix cyclic dependency
	process.nextTick(() => {
		// eslint-disable-next-line global-require
		require('../Utils/ViDeb/index');
	});
}

// @TODO: move the following stuff into the correct files

const serialRecv = () => {
	setImmediate(serialRecv);
	for(const device of broker.devices.values())
		device.poll();
	const currentDevices = broker.getDevices();
	const attached = new Set();
	const detached = new Set();
	for(const device of currentDevices) {
		if(!broker.prevDevices.has(device))
			attached.add(device);
	}
	for(const device of broker.prevDevices) {
		if(!currentDevices.has(device))
			detached.add(device);
	}
	broker.prevDevices = currentDevices;
	if(attached.size > 0 || detached.size > 0)
		broker.emit('devicesChanged', currentDevices, attached, detached);
};
serialRecv();

const DUAL_PANTO_MANUFACTURERES = ['Arduino LLC', 'Atmel Corp. at91sam SAMBA bootloader'];

const isDualPanto = port => {
	if(port.vendorId && port.vendorId === '2341')
		return true;
	if(port.manufacturer) {
		for(const manufacturer of DUAL_PANTO_MANUFACTURERES) {
			if(port.manufacturer.includes(manufacturer))
				return true;
		}
	}
	return false;
};

const autoDetectDevices = () => {
	SerialPort.list((err, ports) => {
		if(err) {
			console.error(err);
			return;
		}
		for(const port of ports) {
			if(isDualPanto(port)) {
				// eslint-disable-next-line no-new
				new Device(port.comName);
			}
		}
	});
};
autoDetectDevices();

if(!CI) {
	usb.on('attach', autoDetectDevices);
	usb.on('detach', autoDetectDevices);
}
