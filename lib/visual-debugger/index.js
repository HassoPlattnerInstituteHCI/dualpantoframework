'use strict';

const http = require('http');
const {Server: WebSocketServer} = require('ws');

const files = require('./files');
const Client = require('./client');

const {getJSON} = require('./util');

module.exports = (broker, port) => {
	const handleError = err => {
		if(!broker.emit('visualDebuggerError', err))
			broker.emit('error', err);
	};
	const server = http.createServer(files)
		.on('error', handleError)
		.listen(port, () => {
			console.log(`visual debugger: listening on port ${port}`);
			let url = `http://localhost:${port}/`;
			if(process.stdout.isTTY)
				url = `\u001b[4m${url}\u001b[24m`;
			console.log(`                 --> ${url}`);
		});

	const wss = new WebSocketServer({
		server,
	})
		.on('error', handleError)
		.on('connection', (ws, req) => {
			Client.create(broker, ws, req);
		});

	broker.on('saySpeak', text => {
		const data = {
			type: 'saySpeak',
			text,
		};

		for(const ws of wss.clients)
			ws.send(getJSON(data));
	});
};
