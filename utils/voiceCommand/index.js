var EventEmitter 	= require('events').EventEmitter,
	util 			= require("util"),
	spawn 			= require('child_process').spawn;

var exe = __dirname + '/.bin/voice-command';

function VoiceCommand(cmds) {
	EventEmitter.call(this);
	if(!cmds.length) {
		throw new Error('Invalid argument. Cmds must be a string array with at least one item.');
	}
	this.cmds = cmds;
}

util.inherits(VoiceCommand, EventEmitter);

VoiceCommand.prototype.startListening = function() {
	if(this.childProcess) {
		throw new Error('Already listening');
	}

	var that = this;
	var lingeringLine = "";
	var process = spawn(exe, this.cmds);
	process.stdout.setEncoding('UTF-8');
	
	process.stdout.on('data', function(data) {
		var cmd = data.trim();
	    that.emit('command', cmd);
	});

	this.childProcess = process;
};

VoiceCommand.prototype.stopListening = function() {
	if(!this.childProcess) {
		throw new Error('Not listening');
	}

	this.childProcess.kill();
	this.childProcess = null;
};

module.exports = VoiceCommand;