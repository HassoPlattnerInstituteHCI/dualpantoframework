'use strict';

// inspired by play-sound: https://github.com/shime/play-sound
// but better error handling

const {execFile, execFileSync} = require('child_process');

const PALAYERS = [
	'mplayer',
	'afplay',
	'mpg123',
	'mpg321',
	'play',
	'omxplayer',
	'aplay',
	'cmdmp3',
];

const NO_ENCODING = {encoding: 'buffer'};

// inspired by find-exec: https://github.com/shime/find-exec
const IS_WINDOWS = process.platform === 'win32';
const EXISTS_CMD = IS_WINDOWS ? 'where' : 'command';
const EXISTS_ARGS = IS_WINDOWS ? [] : ['-v'];

const existsExec = command => {
	try {
		execFileSync(EXISTS_CMD, [...EXISTS_ARGS, command], NO_ENCODING);
		return true;
	} catch(err) {
		return false;
	}
};

const findExec = commands => {
	for(const command of commands) {
		if(existsExec(command))
			return command;
	}
	return null;
};

const player = findExec(PALAYERS);

const play = filename => {
	let child;
	const promise = new Promise(resolve => {
		child = execFile(player, [filename], NO_ENCODING, err => {
			if(err)
				console.error('sound:', err);
			resolve();
		});
	});
	const stop = () => {
		child.kill();
	};
	// make the stop funktion awaitable
	stop.then = promise.then.bind(promise);
	return stop;
};

module.exports = play;
