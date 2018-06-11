'use strict';

const Vector = require('../../Vector');

const {getJSON} = require('./util');

class Client {
	static create(broker, ws, req) {
		return new Client(broker, ws, req);
	}

	constructor(broker, ws, req) {
		console.log('visual debugger: client connected:', req.connection.remoteAddress);

		this.broker = broker;
		this.ws = ws;
		this.req = req;

		this.listeners = [];

		// get the newest device of the broker
		let device = null;
		for(const dev of broker.physicalDevices)
			device = dev;

		// or create a virtual device if no other device is available
		this.isMyDevice = device === null;
		if(this.isMyDevice)
			device = broker.createVirtualDevice();
		this.device = device;

		// delegate handleMoved events to the client
		this.addDeviceListener('handleMoved', (i, p) => {
			this.sendJSON({
				type: 'handleMoved',
				port: device.port,
				index: i,
				position: p,
			});
		});

		// delegate moveHandleTo events to the client
		this.addDeviceListener('moveHandleTo', (i, p) => {
			this.sendJSON({
				type: 'moveHandleTo',
				port: device.port,
				index: i,
				position: p,
			});
		});

		// delegate applyForceTo events to the client
		this.addDeviceListener('applyForceTo', (i, f) => {
			this.sendJSON({
				type: 'applyForceTo',
				port: device.port,
				index: i,
				force: f,
			});
		});

		// add message handler
		ws.on('message', message => {
			this.handleMessage(message);
		});

		// add close handler
		ws.on('close', () => {
			this.handleClose();
		});
	}

	addDeviceListener(event, listener) {
		this.listeners.push([event, listener]);
		this.device.on(event, listener);
	}

	sendJSON(data) {
		this.ws.send(getJSON(data));
	}

	handleMessage(message) {
		const data = JSON.parse(message);
		const device = this.broker.getDeviceByPort(data.port);
		switch(data.type) {
			case 'createVirtualDevice':
			// no longer needed
				break;
			case 'moveHandleTo':
				device.moveHandleTo(data.index, new Vector(data.position));
				break;
			case 'handleMoved':
				device.emit('handleMoved', data.index, new Vector(data.position));
				break;
			case 'disconnectDevice':
			// no longer needed
				break;
			case 'inputText':
				this.broker.voiceInteraction.handleCommand(data.text);
				break;
			default:
				console.error('visual debugger: unknown client message:', data);
				break;
		}
	}

	handleClose() {
		console.log('visual debugger: client disconnected:', this.req.connection.remoteAddress);

		// remove all event listeners to prevent memory leaks
		for(const [event, listener] of this.listeners)
			this.device.removeListener(event, listener);

		// close the device if it was created only for this client
		if(this.isMyDevice)
			this.device.disconnect();
	}
}

module.exports = Client;
