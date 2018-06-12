'use strict';

// entry file, exported as 'the framwork'
const {emptyBroker, proxyBroker} = require('./legacy-broker');

/**
 * The dual panto framework. All classes and {@link util utility} functions are exported.
 * This also includes the {@link Geometry geometry} classes (e.g. {@link Vector}).
 * @name DualPantoFramework
 * @example
 * const {Broker, Vector, delay} = require('dualpantoframework');
 *
 * const broker = new Broker();
 *
 * broker.on('device', async device => {
 *     await delay(500);
 *     await device.movePantoTo(0, new Vector(20, -30, 0));
 *     await device.speakText('Hallo Welt!');
 * })
 */
const framework = emptyBroker;
module.exports = proxyBroker;

// core classes
framework.Broker = require('./broker');
framework.Device = require('./device');

// util functions
Object.assign(framework, require('./util'));

// geometry classes
Object.assign(framework, require('./geometry'));
