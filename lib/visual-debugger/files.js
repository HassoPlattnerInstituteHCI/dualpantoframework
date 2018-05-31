'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CONTENT_TYPE = 'text/plain';
const CONTENT_TYPE = Object.assign(Object.create(null), {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpg',
});

const pipeAsync = (file, res) => new Promise((resolve, reject) => {
	file.on('error', reject)
		.pipe(res)
		.on('error', reject)
		.on('end', resolve);
});

// handle a http request (static files)
const handle = async (req, res) => {
	// eslint-disable-next-line no-path-concat
	const filename = __dirname + (req.url === '/' ? '/index.html' : path.normalize(`/static/${decodeURI(req.url)}`));
	const extname = path.extname(filename);
	const contentType = CONTENT_TYPE[extname] || DEFAULT_CONTENT_TYPE;
	res.setHeader('Content-Type', contentType);
	await pipeAsync(fs.createReadStream(filename), res);
};

// wrapper arround the async handle method
const handleSync = (req, res) => {
	handle(req, res)
		.then(() => res.end())
		.catch(err => {
			console.error('visual-debugger:', err);
			res.statusCode = 500;
			res.end();
		});
};

module.exports = handleSync;
