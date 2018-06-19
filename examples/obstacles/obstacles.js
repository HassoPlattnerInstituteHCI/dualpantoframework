'use strict';

const {Broker, Vector, Polygon} = require('.');

const broker = new Broker();

broker.on('device', device => {
	device.meHandle.addObstacle(new Polygon([
		new Vector(-20, -20),
		new Vector(-20, -80),
		new Vector(-80, -80),
		new Vector(-80, -20),
	]));
	device.meHandle.addObstacle(new Polygon([
		new Vector(40, -60),
		new Vector(40, -200),
		new Vector(200, -200),
		new Vector(200, -60),
	]));
	device.speakText('Let\'s go');
});
