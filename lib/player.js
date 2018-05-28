'use strict';

// inspired by play-sound: https://github.com/shime/play-sound
// but better error handling

const {execFile, execFileSync} = require('child_process');

const PALAYERS = {
	mplayer: {
		args: ['-really-quiet'],
		changePlaying: child => {
			child.stdin.write('p');
		},
	},
	afplay: {
		changePlaying: (child, isPlaying) => {
			const SIG = isPlaying ? 'SIGCONT' : 'SIGSTOP';
			child.kill(SIG);
		},
	},
	mpg123: {
		args: ['--control'],
		changePlaying: child => {
			child.stdin.write('s');
		},
	},
	mpg321: {},
	play: {},
	omxplayer: {},
	aplay: {},
	cmdmp3: {},
};

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

let player = null;
for(const name of Object.keys(PALAYERS)) {
	if(existsExec(name)) {
		player = name;
		break;
	}
}
PALAYERS.null = {};

const changePlayingNotImplemented = () => {
	throw new Error(`Player: play/pause is not implemented using this player: ${player}`);
};

const playerArgs = PALAYERS[player].args || [];
const changePlaying = PALAYERS[player].changePlaying || changePlayingNotImplemented;

/**
* Player is a class to control the playing of a file
* @property {boolean} isPlaying - is the player currently playing
*/
class Player {
	/**
	* Create a new Player object.
	* It starts playing the file immidiatly.
	* @param {string} filename - The filename of the soundfile.
	*/
	constructor(filename) {
		this.child = null;
		this.isPlaying = true;
		this.promise = new Promise(resolve => {
			this.child = execFile(player, [...playerArgs, filename], NO_ENCODING, err => {
				if(err && !err.killed)
					console.error('sound:', err);
				this.isPlaying = false;
				resolve();
			});
		});
	}

	/**
	* The Player object is awaitable.
	* @example
	* await new Player('test.mp3');
	*/
	then(...args) {
		this.promise.then(...args);
	}

	/**
	* Continue playing.
	*/
	play() {
		if(!this.isPlaying) {
			this.isPlaying = true;
			changePlaying(this.child, true);
		}
	}

	/**
	* Pause playing.
	*/
	pause() {
		if(this.isPlaying) {
			this.isPlaying = false;
			changePlaying(this.child, false);
		}
	}

	/**
	* Stop playing.
	*/
	stop() {
		this.child.kill();
		this.child = null;
	}
}

module.exports = Player;
